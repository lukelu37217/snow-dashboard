
import axios from 'axios';
import { getObservation } from './weatherCanadaService';

// Open-Meteo free tier limits:
// - Max ~100 locations per request (to avoid 429 errors)
// - Rate limit: ~10 requests per minute
// Use smaller batches and longer delays to stay within limits
const BATCH_SIZE = 50; // Reduced from 100 to avoid rate limiting
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const CHUNK_DELAY_MS = 2000; // 2 seconds between chunks to respect rate limits

// ============= FALLBACK MODE =============
// Set to true to use mock data when API is rate-limited (429 errors)
// Set to false to use real API calls
const USE_MOCK_DATA = false; // Toggle this when API limits reset

// ============= CACHE SYSTEM =============
// Cache weather data for 15 minutes to reduce API calls significantly
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (balanced for Western Sector batch fetching)

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
    snowAccumulation24h: number; // cm (Sum of NEXT 24h forecast)
    pastSnow24h: number; // cm (Sum of PAST 24h actual)
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

const fetchWithRetry = async (url: string, params: any, retries = 3, delay = 3000): Promise<any> => {
    try {
        const response = await axios.get(url, { params, timeout: 30000 }); // Longer timeout for large batches
        return response.data;
    } catch (error: any) {
        const status = error?.response?.status;
        const retryAfterHeader = error?.response?.headers?.['retry-after'];
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;

        if (retries > 0 && (status === 429 || status === 503 || status === 500)) {
            // For 429 errors, use exponential backoff with jitter
            // Minimum 5 seconds, maximum 60 seconds
            const baseBackoff = retryAfterMs ?? delay * 2;
            const jitter = Math.floor(Math.random() * 2000); // 0-2s random
            const backoff = Math.min(60000, Math.max(5000, baseBackoff + jitter));
            console.log(`Rate limited (${status}), waiting ${Math.round(backoff / 1000)}s before retry...`);
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
        // In MOCK MODE, use fully mocked data for demo consistency
        if (USE_MOCK_DATA) {
            const forecast = await fetchDetailedForecast(lat, lon, forceRefresh);
            if (!forecast) throw new Error("Forecast failed");

            // Mock observation that matches forecast data for demo
            const snowCodes = [71, 73, 75, 77, 85, 86];
            const isSnowingNow = forecast.current.snowfall > 0 || 
                (forecast.current.weather_code !== undefined && snowCodes.includes(forecast.current.weather_code));

            const current = {
                temperature: forecast.current.temperature_2m,
                isSnowing: isSnowingNow,
                condition: isSnowingNow ? "Snow" : "Cloudy",
                source: 'observation' as const // Mark as observation for UI display
            };

            const snowRemoval = calculateSnowRemoval(forecast.hourly);

            return { current, forecast, snowRemoval };
        }

        // REAL MODE: Parallel Fetch from APIs
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
        const mockResults: WeatherData[] = locations.map((loc, index) => {
            // DEMO MODE: Create a realistic distribution to showcase all features
            // - 5% RED zones (Commercial: 5-8cm) - high priority
            // - 15% ORANGE zones (Residential: 1-4.9cm) - medium priority  
            // - 80% GREEN zones (0-0.9cm) - monitoring only
            
            const roll = Math.random();
            let snowAccum24h: number;
            let pastSnow24h: number;
            let priority: 'high' | 'medium' | 'low';
            let needsRemoval: boolean;
            
            if (roll < 0.05) {
                // RED - Commercial trigger (5cm+)
                snowAccum24h = 5 + Math.random() * 3; // 5-8cm future
                pastSnow24h = 3 + Math.random() * 2; // 3-5cm already fallen
                priority = 'high';
                needsRemoval = true;
            } else if (roll < 0.20) {
                // ORANGE - Residential trigger (1-4.9cm)
                snowAccum24h = 1 + Math.random() * 3.9; // 1-4.9cm future
                pastSnow24h = 0.5 + Math.random() * 1.5; // 0.5-2cm already fallen
                priority = 'medium';
                needsRemoval = true;
            } else if (roll < 0.35) {
                // Light snow - SALTING/WATCH (0.3-0.9cm)
                snowAccum24h = 0.3 + Math.random() * 0.6; // 0.3-0.9cm
                pastSnow24h = Math.random() * 0.3; // trace amounts
                priority = 'low';
                needsRemoval = false;
            } else {
                // GREEN - Clear (0-0.3cm)
                snowAccum24h = Math.random() * 0.3; // 0-0.3cm
                pastSnow24h = 0; // no snow
                priority = 'low';
                needsRemoval = false;
            }
            
            const hasActiveSnow = snowAccum24h > 0.5;
            
            return {
                id: loc.id,
                temperature: -12 + Math.random() * 4, // -12 to -8°C (cold Winnipeg day)
                snowfall: hasActiveSnow ? 0.1 + Math.random() * 0.4 : 0, // current rate
                apparentTemperature: -18 + Math.random() * 4,
                windGusts: 25 + Math.random() * 15, // 25-40 km/h
                snowAccumulation24h: snowAccum24h,
                pastSnow24h: pastSnow24h,
                snowRemoval: {
                    needsRemoval,
                    priority,
                    reasons: snowAccum24h >= 5 
                        ? [`24h: ${snowAccum24h.toFixed(1)}cm (Commercial)`]
                        : snowAccum24h >= 1 
                            ? [`24h: ${snowAccum24h.toFixed(1)}cm (Residential)`]
                            : snowAccum24h >= 0.3
                                ? [`24h: ${snowAccum24h.toFixed(1)}cm (Salting)`]
                                : [],
                    snowDepthCm: pastSnow24h * 0.85, // Use past snow for depth
                    recent3hSnowfall: hasActiveSnow ? 0.2 + Math.random() * 0.8 : 0,
                    next3hSnowfall: hasActiveSnow ? 0.3 + Math.random() * 1.2 : 0
                }
            };
        });
        
        // Cache mock data too
        weatherCache.set(cacheKey, { data: mockResults, timestamp: Date.now() });
        return mockResults;
    }

    console.log(`Fetching weather for ${locations.length} locations...`);

    // Split into smaller chunks to avoid rate limiting
    // Open-Meteo free tier is more restrictive than documented
    // Using 50 per batch with 2s delay between batches
    const chunks: typeof locations[] = [];
    for (let i = 0; i < locations.length; i += BATCH_SIZE) {
        chunks.push(locations.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Split into ${chunks.length} chunks of max ${BATCH_SIZE} locations each`);

    const results: WeatherData[] = [];

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx];
        const lats = chunk.map(l => l.lat).join(',');
        const lons = chunk.map(l => l.lon).join(',');

        try {
            console.log(`Fetching chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} locations)`);
            
            // Fetch with past_days=1 to get past 24h data + forecast_days=2 for future
            const dataListResponse = await fetchWithRetry(BASE_URL, {
                latitude: lats,
                longitude: lons,
                current: 'temperature_2m,snowfall,apparent_temperature,wind_gusts_10m',
                hourly: 'snowfall,snow_depth,temperature_2m',
                past_days: 1,     // Include past 24 hours of data
                forecast_days: 2, // Need 2 days to ensure 24h coverage from any hour
                timezone: 'America/Winnipeg'
            });

            const dataList = Array.isArray(dataListResponse) ? dataListResponse : [dataListResponse];

            dataList.forEach((data: any, index: number) => {
                const loc = chunk[index];
                if (!loc) return; // Safety check
                
                const current = data.current || {};
                const hourly = data.hourly || {};

                // With past_days=1, hourly data starts from 24 hours ago
                // Index 0-23 = past 24h, index 24+ = today onwards
                const now = new Date();
                const currentHourIndex = 24 + now.getHours(); // Offset by past day
                
                // PAST 24h: Sum snowfall from index 0 to currentHourIndex
                let past24hSnow = 0;
                if (hourly.snowfall) {
                    for (let k = Math.max(0, currentHourIndex - 24); k < currentHourIndex && k < hourly.snowfall.length; k++) {
                        past24hSnow += hourly.snowfall[k] || 0;
                    }
                }
                
                // FUTURE 24h: Sum snowfall from currentHourIndex to currentHourIndex + 24
                let next24hSnow = 0;
                if (hourly.snowfall) {
                    for (let k = currentHourIndex; k < currentHourIndex + 24 && k < hourly.snowfall.length; k++) {
                        next24hSnow += hourly.snowfall[k] || 0;
                    }
                }

                // Use PAST 24h for removal status (what has actually fallen)
                const removalStatus = calculateSnowRemoval(hourly, past24hSnow);

                results.push({
                    id: loc.id,
                    temperature: current.temperature_2m || 0,
                    snowfall: current.snowfall || 0,
                    apparentTemperature: current.apparent_temperature || 0,
                    windGusts: current.wind_gusts_10m || 0,
                    snowAccumulation24h: next24hSnow,  // Future forecast
                    pastSnow24h: past24hSnow,          // Actual past accumulation
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
                    pastSnow24h: 0,
                    snowRemoval: { needsRemoval: false, priority: 'low', reasons: [], snowDepthCm: 0, recent3hSnowfall: 0, next3hSnowfall: 0 }
                });
            });
        }

        // Delay between chunks to respect rate limits
        // Open-Meteo free tier: ~10 requests per minute
        if (chunks.length > 1 && chunkIdx < chunks.length - 1) {
            console.log(`Waiting ${CHUNK_DELAY_MS}ms before next chunk to respect rate limits...`);
            await sleep(CHUNK_DELAY_MS);
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
        const currentHour = now.getHours();
        const hourlyTimes: string[] = [];
        const hourlySnowfall: number[] = [];
        const hourlySnowDepth: number[] = [];
        const hourlyTemp: number[] = [];
        const hourlyPrecipProb: number[] = [];
        const hourlyApparent: number[] = [];
        const hourlyWindGusts: number[] = [];
        const hourlyWeatherCode: number[] = [];
        
        // DEMO: Create a realistic snow event pattern
        // Snow starts now, peaks in 4-6 hours, ends around +16 hours (early morning tomorrow)
        const snowStartHour = 0; // relative to now
        const snowPeakHour = 5;  // peak intensity
        const snowEndHour = 16;  // snow stops
        
        // Generate 168 hours (7 days) of mock data
        for (let i = 0; i < 168; i++) {
            const time = new Date(now.getTime() + i * 3600000);
            hourlyTimes.push(time.toISOString().slice(0, 16));
            
            const hour = time.getHours();
            const isNight = hour < 6 || hour > 20;
            const baseTemp = isNight ? -15 : -10;
            hourlyTemp.push(baseTemp + Math.random() * 3);
            hourlyApparent.push(baseTemp - 6 + Math.random() * 2);
            hourlyWindGusts.push(28 + Math.random() * 12); // 28-40 km/h
            
            // Snow pattern: bell curve peaking at snowPeakHour
            let snowfall = 0;
            let precipProb = 20;
            let weatherCode = 3; // Overcast default
            
            if (i >= snowStartHour && i < snowEndHour) {
                // Active snow period
                const distFromPeak = Math.abs(i - snowPeakHour);
                const intensity = Math.max(0, 1 - (distFromPeak / 8)); // Bell curve
                snowfall = intensity * (0.8 + Math.random() * 0.6); // 0-1.4 cm/h at peak
                precipProb = 60 + Math.floor(intensity * 30); // 60-90%
                
                // Weather codes based on intensity
                if (snowfall > 0.8) {
                    weatherCode = 75; // Heavy snow
                } else if (snowfall > 0.3) {
                    weatherCode = 73; // Moderate snow
                } else if (snowfall > 0) {
                    weatherCode = 71; // Light snow
                }
            } else if (i >= snowEndHour && i < snowEndHour + 6) {
                // Flurries after main event
                snowfall = Math.random() < 0.3 ? Math.random() * 0.2 : 0;
                precipProb = 30;
                weatherCode = snowfall > 0 ? 71 : 3;
            }
            
            hourlySnowfall.push(Math.round(snowfall * 100) / 100);
            hourlySnowDepth.push(0.05 + (i < snowEndHour ? i * 0.008 : snowEndHour * 0.008)); // Accumulating depth
            hourlyPrecipProb.push(precipProb);
            hourlyWeatherCode.push(weatherCode);
        }
        
        // Daily forecast with clear snow event on day 1, clearing after
        const dailyTimes: string[] = [];
        const dailyMax: number[] = [];
        const dailyMin: number[] = [];
        const dailySnowSum: number[] = [];
        const dailyWeatherCode: number[] = [];
        
        const dailyData = [
            { maxOffset: -8, minOffset: -16, snow: 4.5, code: 73 },  // Today: Snow
            { maxOffset: -6, minOffset: -14, snow: 1.2, code: 71 },  // Tomorrow: Light snow
            { maxOffset: -4, minOffset: -12, snow: 0, code: 3 },     // Day 3: Cloudy
            { maxOffset: -5, minOffset: -15, snow: 2.8, code: 73 },  // Day 4: More snow
            { maxOffset: -3, minOffset: -11, snow: 0, code: 2 },     // Day 5: Partly cloudy
            { maxOffset: -2, minOffset: -10, snow: 0, code: 0 },     // Day 6: Clear
            { maxOffset: -4, minOffset: -13, snow: 0.5, code: 71 },  // Day 7: Light snow
        ];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(now.getTime() + i * 86400000);
            dailyTimes.push(day.toISOString().slice(0, 10));
            dailyMax.push(dailyData[i].maxOffset + Math.random() * 2);
            dailyMin.push(dailyData[i].minOffset + Math.random() * 2);
            dailySnowSum.push(dailyData[i].snow);
            dailyWeatherCode.push(dailyData[i].code);
        }
        
        const mockForecast: DetailedForecast = {
            hourly: {
                time: hourlyTimes,
                snowfall: hourlySnowfall,
                snow_depth: hourlySnowDepth,
                temperature_2m: hourlyTemp,
                apparent_temperature: hourlyApparent,
                wind_gusts_10m: hourlyWindGusts,
                precipitation_probability: hourlyPrecipProb,
                weather_code: hourlyWeatherCode
            },
            current: {
                temperature_2m: -12,
                snowfall: 0.4, // Currently snowing
                apparent_temperature: -18,
                wind_gusts_10m: 32,
                weather_code: 73 // Moderate snow
            },
            daily: {
                time: dailyTimes,
                temperature_2m_max: dailyMax,
                temperature_2m_min: dailyMin,
                snowfall_sum: dailySnowSum,
                weather_code: dailyWeatherCode
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
