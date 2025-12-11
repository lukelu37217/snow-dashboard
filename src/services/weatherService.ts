
import axios from 'axios';
import { getObservation } from './weatherCanadaService';

// Open-Meteo allows up to 1000 locations per request - use larger batches
const BATCH_SIZE = 100;
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// ============= FALLBACK MODE =============
// Set to true to use mock data when API is rate-limited (429 errors)
// Set to false to use real API calls
const USE_MOCK_DATA = false; // Toggle this when API limits reset

// ============= CACHE SYSTEM =============
// Cache weather data for 30 minutes to reduce API calls significantly
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (increased from 10)

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const weatherCache: Map<string, CacheEntry<WeatherData[]>> = new Map();
const forecastCache: Map<string, CacheEntry<DetailedForecast>> = new Map();

const isCacheValid = <T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
};

// Generate cache key from locations
const getBatchCacheKey = (locations: { id: string }[]): string => {
    return `batch_${locations.map(l => l.id).sort().join('_')}`;
};

export const clearWeatherCache = () => {
    weatherCache.clear();
    forecastCache.clear();
    console.log('Weather cache cleared');
};

export interface SnowRemovalStatus {
    needsRemoval: boolean;
    priority: 'high' | 'medium' | 'low';
    reasons: string[];
    snowDepthCm: number;
    recent3hSnowfall: number;
    next3hSnowfall: number;
}

export interface WeatherData {
    id: string;
    temperature: number;
    apparentTemperature: number;
    windGusts: number; // km/h
    snowAccumulation24h: number; // cm (Sum of next 24h)
    snowfall: number; // Current rate

    // New Extended Status
    snowRemoval?: SnowRemovalStatus;
}

export interface DetailedForecast {
    hourly: {
        time: string[];
        snowfall: number[];
        snow_depth: number[];
        temperature_2m: number[];
        apparent_temperature?: number[];
        wind_gusts_10m?: number[];
        precipitation_probability?: number[];
        weather_code?: number[]; // WMO Weather Code
    };
    current: {
        temperature_2m: number;
        snowfall: number;
        apparent_temperature?: number;
        wind_gusts_10m?: number;
        weather_code?: number;
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        snowfall_sum: number[];
        weather_code?: number[]; // WMO Weather Code
    };
}

// Helper: Calculate Removal Status based on 24h snow accumulation
// Business Rules:
// - >= 1cm in 24h: Residential clearing needed (medium priority)
// - >= 5cm in 24h: Commercial clearing needed (high priority)
const calculateSnowRemoval = (hourly: any, snowAccum24h: number = 0): SnowRemovalStatus => {
    // Indices for "Now"
    const currentHour = new Date().getHours();

    // Safety check for arrays
    const snowDepthArr = hourly.snow_depth || [];
    const snowfallArr = hourly.snowfall || [];

    // Current Depth (cm) = meters * 100
    const currentDepthM = snowDepthArr[currentHour] || 0;
    const snowDepthCm = currentDepthM * 100;

    // Recent 3h (Previous 2 + Current)
    let recent3h = 0;
    for (let i = Math.max(0, currentHour - 2); i <= currentHour; i++) {
        recent3h += (snowfallArr[i] || 0);
    }

    // Next 3h (Current + Next 2)
    let next3h = 0;
    let limit = Math.min(snowfallArr.length, currentHour + 3);
    for (let i = currentHour; i < limit; i++) {
        next3h += (snowfallArr[i] || 0);
    }

    // NEW LOGIC: Based on 24h snowfall accumulation
    // >= 5cm: Commercial (high priority) - RED
    // >= 1cm: Residential (medium priority) - YELLOW
    // < 1cm: No action needed (low priority) - GREEN
    const needsRemoval = snowAccum24h >= 1;
    let priority: 'high' | 'medium' | 'low' = 'low';
    
    if (snowAccum24h >= 5) {
        priority = 'high'; // Commercial plow needed
    } else if (snowAccum24h >= 1) {
        priority = 'medium'; // Residential clearing needed
    }

    const reasons = [];
    if (snowAccum24h >= 5) reasons.push(`24h: ${snowAccum24h.toFixed(1)}cm (Commercial)`);
    else if (snowAccum24h >= 1) reasons.push(`24h: ${snowAccum24h.toFixed(1)}cm (Residential)`);
    if (recent3h >= 5) reasons.push(`Recent 3h: ${recent3h.toFixed(1)}cm`);
    if (next3h >= 5) reasons.push(`Next 3h: ${next3h.toFixed(1)}cm`);

    return {
        needsRemoval,
        priority,
        reasons,
        snowDepthCm,
        recent3hSnowfall: recent3h,
        next3hSnowfall: next3h
    };
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const fetchWithRetry = async (url: string, params: any, retries = 3, delay = 2000): Promise<any> => {
    try {
        const response = await axios.get(url, { params, timeout: 30000 }); // Longer timeout for large batches
        return response.data;
    } catch (error: any) {
        const status = error?.response?.status;
        const retryAfterHeader = error?.response?.headers?.['retry-after'];
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;

        if (retries > 0 && (status === 429 || status === 503 || status === 500)) {
            const backoff = retryAfterMs ?? delay * 2 + Math.floor(Math.random() * 1000);
            console.log(`Rate limited (${status}), waiting ${backoff}ms before retry...`);
            await sleep(backoff);
            return fetchWithRetry(url, params, retries - 1, delay * 2);
        }

        if (retries > 0) {
            await sleep(delay);
            return fetchWithRetry(url, params, retries - 1, delay * 2);
        }

        throw error;
    }
};

/**
 * Hybrid Fetch: Get Detailed Weather for a Single Point
 * Strategies:
 * 1. Fetch Open-Meteo Forecast.
 * 2. Fetch EC Observation (XWG) - Cached/Shared if possible, but here we call it.
 * 3. Merge.
 */
export interface HybridWeatherResult {
    current: {
        temperature: number;
        isSnowing: boolean;
        condition: string;
        source: 'observation' | 'forecast';
    };
    forecast: DetailedForecast;
    snowRemoval: SnowRemovalStatus;
}

export const fetchCommunityWeather = async (lat: number, lon: number, forceRefresh = false): Promise<HybridWeatherResult | null> => {
    try {
        // Parallel Fetch
        const [forecast, observation] = await Promise.all([
            fetchDetailedForecast(lat, lon, forceRefresh),
            getObservation() // Fetches XWG XML
        ]);

        if (!forecast) throw new Error("Forecast failed");

        // Merge Logic
        const isObsValid = !!observation;

        // Snowing Check
        const snowCodes = [71, 73, 75, 77, 85, 86];
        const isSnowingForecast = (forecast.current.snowfall > 0) || (forecast.current.weather_code !== undefined && snowCodes.includes(forecast.current.weather_code));

        const current = {
            temperature: isObsValid ? observation.temperature : forecast.current.temperature_2m,
            isSnowing: isObsValid ? observation.isSnowing : isSnowingForecast,
            condition: isObsValid ? observation.condition : "Model Forecast", // simplified
            source: isObsValid ? 'observation' : 'forecast'
        } as const;

        const snowRemoval = calculateSnowRemoval(forecast.hourly);

        return {
            current,
            forecast,
            snowRemoval
        };

    } catch (e) {
        console.error("Hybrid fetch failed", e);
        return null; // Handle UI error
    }
};


// BATCH FETCH for Map (Pure Open-Meteo for speed) - WITH CACHING
export const fetchWeatherBatch = async (locations: { id: string; lat: number; lon: number }[], forceRefresh = false): Promise<WeatherData[]> => {
    // Check cache first (unless force refresh)
    const cacheKey = getBatchCacheKey(locations);
    if (!forceRefresh) {
        const cached = weatherCache.get(cacheKey);
        if (isCacheValid(cached)) {
            console.log('Using cached weather data');
            return cached.data;
        }
    }

    // USE MOCK DATA when API is rate-limited
    if (USE_MOCK_DATA) {
        console.log('📊 Using mock weather data (API rate-limited)');
        const mockResults: WeatherData[] = locations.map(loc => {
            // Generate realistic snow accumulation (most zones 0, some with snow)
            const hasSnow = Math.random() < 0.15; // 15% chance of snow
            const snowAccum24h = hasSnow ? Math.random() * 3 : 0; // 0-3cm when snowing
            
            // Determine priority based on 24h accumulation
            let priority: 'high' | 'medium' | 'low' = 'low';
            let needsRemoval = false;
            
            if (snowAccum24h >= 5) {
                priority = 'high'; // Commercial
                needsRemoval = true;
            } else if (snowAccum24h >= 1) {
                priority = 'medium'; // Residential
                needsRemoval = true;
            }
            
            return {
                id: loc.id,
                temperature: -2 + Math.random() * 4, // -2 to +2°C (realistic for Winnipeg)
                snowfall: hasSnow ? Math.random() * 0.5 : 0,
                apparentTemperature: -5 + Math.random() * 4,
                windGusts: 10 + Math.random() * 20,
                snowAccumulation24h: snowAccum24h,
                snowRemoval: {
                    needsRemoval,
                    priority,
                    reasons: snowAccum24h >= 1 ? [`24h: ${snowAccum24h.toFixed(1)}cm`] : [],
                    snowDepthCm: snowAccum24h * 0.8, // rough estimate
                    recent3hSnowfall: hasSnow ? Math.random() * 1 : 0,
                    next3hSnowfall: hasSnow ? Math.random() * 0.5 : 0
                }
            };
        });
        
        // Cache mock data too
        weatherCache.set(cacheKey, { data: mockResults, timestamp: Date.now() });
        return mockResults;
    }

    console.log(`Fetching weather for ${locations.length} locations...`);

    // Split into chunks (Open-Meteo supports up to ~1000 per request, we use 100 to be safe)
    const chunks: typeof locations[] = [];
    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
        chunks.push(locations.slice(i, i + BATCH_SIZE));
    }

    const results: WeatherData[] = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx];
        const lats = chunk.map(l => l.lat).join(',');
        const lons = chunk.map(l => l.lon).join(',');

        try {
            console.log(`Fetching chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} locations)`);
            
            const dataListResponse = await fetchWithRetry(BASE_URL, {
                latitude: lats,
                longitude: lons,
                current: 'temperature_2m,snowfall,apparent_temperature,wind_gusts_10m',
                hourly: 'snowfall,snow_depth,temperature_2m',
                forecast_days: 1,
                timezone: 'America/Winnipeg'
            });

            const dataList = Array.isArray(dataListResponse) ? dataListResponse : [dataListResponse];

            dataList.forEach((data: any, index: number) => {
                const loc = chunk[index];
                if (!loc) return; // Safety check
                
                const current = data.current || {};
                const hourly = data.hourly || {};

                // 24h Accumulation
                const currentHour = new Date().getHours();
                let next24hSnow = 0;
                if (hourly.snowfall) {
                    for (let k = currentHour; k < currentHour + 24 && k < hourly.snowfall.length; k++) {
                        next24hSnow += hourly.snowfall[k];
                    }
                }

                // Pass 24h snowfall to calculate removal status
                const removalStatus = calculateSnowRemoval(hourly, next24hSnow);

                results.push({
                    id: loc.id,
                    temperature: current.temperature_2m || 0,
                    snowfall: current.snowfall || 0,
                    apparentTemperature: current.apparent_temperature || 0,
                    windGusts: current.wind_gusts_10m || 0,
                    snowAccumulation24h: next24hSnow,
                    snowRemoval: removalStatus
                });
            });

        } catch (error) {
            console.error(`Batch fetch error for chunk ${chunkIdx + 1}:`, error);
            // Add placeholder data for failed locations so map still renders
            chunk.forEach(loc => {
                results.push({
                    id: loc.id,
                    temperature: 0,
                    snowfall: 0,
                    apparentTemperature: 0,
                    windGusts: 0,
                    snowAccumulation24h: 0,
                    snowRemoval: { needsRemoval: false, priority: 'low', reasons: [], snowDepthCm: 0, recent3hSnowfall: 0, next3hSnowfall: 0 }
                });
            });
        }

        // Small delay between chunks to avoid rate limits (only if multiple chunks)
        if (chunks.length > 1 && chunkIdx < chunks.length - 1) {
            await sleep(500);
        }
    }

    // Cache the results
    weatherCache.set(cacheKey, { data: results, timestamp: Date.now() });
    console.log(`Cached ${results.length} weather results`);

    return results;
};

export const fetchDetailedForecast = async (lat: number, lon: number, forceRefresh = false): Promise<DetailedForecast | null> => {
    const cacheKey = `forecast_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    
    // Check cache first
    if (!forceRefresh) {
        const cached = forecastCache.get(cacheKey);
        if (isCacheValid(cached)) {
            console.log('Using cached forecast data');
            return cached.data;
        }
    }

    // USE MOCK DATA when API is rate-limited
    if (USE_MOCK_DATA) {
        console.log('📊 Using mock forecast data (API rate-limited)');
        
        const now = new Date();
        const hourlyTimes: string[] = [];
        const hourlySnowfall: number[] = [];
        const hourlySnowDepth: number[] = [];
        const hourlyTemp: number[] = [];
        const hourlyPrecipProb: number[] = [];
        const hourlyApparent: number[] = [];
        const hourlyWindGusts: number[] = [];
        
        // Generate 168 hours (7 days) of mock data
        for (let i = 0; i < 168; i++) {
            const time = new Date(now.getTime() + i * 3600000);
            hourlyTimes.push(time.toISOString().slice(0, 16));
            
            // Simulate some weather patterns
            const isNight = time.getHours() < 6 || time.getHours() > 20;
            const baseTemp = isNight ? -8 : -3;
            hourlyTemp.push(baseTemp + Math.random() * 6);
            hourlyApparent.push(baseTemp - 3 + Math.random() * 4);
            hourlySnowfall.push(Math.random() < 0.15 ? Math.random() * 1.5 : 0);
            hourlySnowDepth.push(Math.random() * 0.15); // meters
            hourlyPrecipProb.push(Math.floor(Math.random() * 40));
            hourlyWindGusts.push(15 + Math.random() * 25);
        }
        
        const dailyTimes: string[] = [];
        const dailyMax: number[] = [];
        const dailyMin: number[] = [];
        const dailySnowSum: number[] = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(now.getTime() + i * 86400000);
            dailyTimes.push(day.toISOString().slice(0, 10));
            dailyMax.push(-2 + Math.random() * 5);
            dailyMin.push(-10 + Math.random() * 5);
            dailySnowSum.push(Math.random() < 0.4 ? Math.random() * 8 : 0);
        }
        
        const mockForecast: DetailedForecast = {
            hourly: {
                time: hourlyTimes,
                snowfall: hourlySnowfall,
                snow_depth: hourlySnowDepth,
                temperature_2m: hourlyTemp,
                apparent_temperature: hourlyApparent,
                wind_gusts_10m: hourlyWindGusts,
                precipitation_probability: hourlyPrecipProb
            },
            current: {
                // Use realistic Winnipeg winter temperature (close to Weather Canada observation)
                temperature_2m: -1 + Math.random() * 2, // -1 to +1°C (matches real observation ~-0.1)
                snowfall: 0,
                apparent_temperature: -4 + Math.random() * 2,
                wind_gusts_10m: 5 + Math.random() * 15,
                weather_code: 3 // Overcast
            },
            daily: {
                time: dailyTimes,
                temperature_2m_max: dailyMax,
                temperature_2m_min: dailyMin,
                snowfall_sum: dailySnowSum
            }
        };
        
        // Cache mock data
        forecastCache.set(cacheKey, { data: mockForecast, timestamp: Date.now() });
        return mockForecast;
    }

    try {
        console.log(`Fetching detailed forecast for ${lat}, ${lon}`);
        const data = await fetchWithRetry(BASE_URL, {
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,snowfall,apparent_temperature,wind_gusts_10m,weather_code',
            hourly: 'temperature_2m,snowfall,snow_depth,precipitation_probability,apparent_temperature,wind_gusts_10m,weather_code',
            daily: 'temperature_2m_max,temperature_2m_min,snowfall_sum,weather_code',
            timezone: 'America/Winnipeg',
            forecast_days: 7
        });
        
        // Cache the result
        forecastCache.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
    } catch (e) {
        console.error('Failed to fetch detailed forecast:', e);
        return null;
    }
};

export const fetchWinnipegForecast = async (): Promise<DetailedForecast | null> => {
    return fetchDetailedForecast(49.8951, -97.1384);
};
