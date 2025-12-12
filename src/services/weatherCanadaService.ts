
import axios from 'axios';
import { cacheService } from './cacheService';

// NEW API: Using Weather Canada APIs
// API Documentation: https://api.weather.gc.ca/
// Collections:
//   - swob-realtime: Surface Weather Observations (real-time)
//   - citypageweather-realtime: City Page Weather (hourly forecasts)
const SWOB_API_BASE = 'https://api.weather.gc.ca/collections/swob-realtime/items';
const CITYPAGE_API_BASE = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items';
const OBS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes - increased to reduce API calls
const FORECAST_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for forecast
const OBS_CACHE_KEY = 'env_canada_observation';
const FORECAST_CACHE_KEY = 'env_canada_hourly_forecast';

// Winnipeg Richardson International Airport area - using bbox to find nearby stations
// Coordinates: 49.91, -97.24 (Airport)
const BBOX_QUERY = '-97.5,49.7,-97.0,50.1'; // Covers greater Winnipeg area

export interface RealTimeObservation {
    temperature: number;
    condition: string;
    isSnowing: boolean;
    windSpeed: number;
    humidity: number;
    observationTime: string;
    station: string;
}

// Weather Canada hourly forecast item
export interface ECHourlyForecast {
    timestamp: string;
    temperature: number;
    condition: string;
    iconCode: number;
    precipChance: number; // lop (likelihood of precipitation)
    windSpeed: number;
    windGust?: number;
    windChill?: number;
}

// Weather Canada forecast response
export interface ECForecastData {
    station: string;
    lastUpdated: string;
    hourlyForecasts: ECHourlyForecast[];
    sunrise?: string;
    sunset?: string;
}

export const getObservation = async (): Promise<RealTimeObservation | null> => {
    // Check cache first - observation is shared across all neighborhoods
    const cached = cacheService.get<RealTimeObservation>(OBS_CACHE_KEY);
    if (cached) {
        console.log('✅ Using cached EC observation');
        return cached;
    }

    try {
        // Query SWOB API for Winnipeg area stations using bounding box
        // IMPORTANT: Must include datetime parameter to get today's data, otherwise returns old cached data
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const url = `${SWOB_API_BASE}?bbox=${BBOX_QUERY}&datetime=${today}&f=json&limit=10`;

        console.log(`🌡️ Fetching EC observation for ${today}...`);
        const response = await axios.get(url, { timeout: 10000 });

        if (!response.data || !response.data.features || response.data.features.length === 0) {
            throw new Error("No observation data available");
        }

        // Find the most recent observation from preferred stations (XWG or CYWG)
        // XWG = WINNIPEG 'A' CS (Climate Station at airport)
        // CYWG = Winnipeg Richardson International Airport
        const features = response.data.features;
        
        // Sort by observation time to get most recent
        features.sort((a: any, b: any) => {
            const timeA = a.properties['date_tm-value'] || '';
            const timeB = b.properties['date_tm-value'] || '';
            return timeB.localeCompare(timeA); // Descending order (newest first)
        });
        
        let bestFeature = features.find((f: any) =>
            f.properties['tc_id-value'] === 'XWG' ||
            f.properties['tc_id-value'] === 'CYWG'
        ) || features[0]; // Fallback to first available

        const props = bestFeature.properties;

        // Extract data from SWOB format (properties use -value suffix)
        const temperature = props.air_temp !== null && props.air_temp !== undefined ? props.air_temp : 0;
        const humidity = props.rel_hum !== null && props.rel_hum !== undefined ? props.rel_hum : 0;
        const windSpeed = props.avg_wnd_spd_10m_pst1mt !== null && props.avg_wnd_spd_10m_pst1mt !== undefined
            ? props.avg_wnd_spd_10m_pst1mt * 3.6 // Convert m/s to km/h
            : 0;

        // Snow and precipitation detection
        const snowDepth = props.snw_dpth || props.snw_dpth_1 || 0;
        const pcpnPast1hr = props['pcpn_amt_pst1hr'] || 0; // Total precipitation past hour
        const rnflPast1hr = props['rnfl_amt_pst1hr'] || 0; // Rainfall past hour
        
        // Additional snow indicators
        const presentWeather = props['prsnt_wx'] || props['prsnt_wx-value'] || '';
        const visibilityKm = props['vis'] || props['vis-value'] || 999;

        // If total precip > rainfall, then we have snowfall
        const snowfallAmount = Math.max(0, pcpnPast1hr - rnflPast1hr);

        // IMPROVED: Determine if it's currently snowing using multiple signals:
        // 1. Recent snowfall detected (precipitation when temp < 2°C - snow can fall at slightly above 0)
        // 2. Present weather code contains snow indicator
        // 3. Low visibility + cold temp + any precipitation (likely snow)
        // 4. Temperature below 0 and any precipitation
        const hasSnowPrecip = (snowfallAmount > 0) || (pcpnPast1hr > 0 && temperature < 2);
        const hasSnowWeatherCode = presentWeather.toLowerCase().includes('snow') || 
                                   presentWeather.toLowerCase().includes('sn') ||
                                   presentWeather.includes('S') && !presentWeather.includes('SU');
        const hasReducedVisibility = visibilityKm < 5 && temperature < 2;
        
        const isSnowing = hasSnowPrecip || hasSnowWeatherCode || (hasReducedVisibility && pcpnPast1hr > 0);

        // Generate condition string - also check hourly forecast for current condition
        let condition = "Cloudy"; // Default to cloudy in winter
        if (isSnowing) {
            condition = snowfallAmount > 2 ? "Heavy Snow" : "Snow";
        } else if (hasSnowWeatherCode) {
            condition = "Snow";
        } else if (pcpnPast1hr > 0) {
            condition = temperature < 2 ? "Snow" : "Rain";
        } else if (temperature < -10) {
            condition = "Cold & Clear";
        } else if (snowDepth > 0) {
            condition = "Cloudy";
        }

        const stationName = props['stn_nam-value'] || props.stn_nam || 'Winnipeg Area';
        const stationId = props['tc_id-value'] || 'UNKNOWN';

        const observation: RealTimeObservation = {
            temperature,
            condition,
            isSnowing,
            windSpeed,
            humidity,
            observationTime: props['date_tm-value'] || props.obs_date_tm || new Date().toISOString(),
            station: `${stationName} (${stationId})`
        };

        // ENHANCEMENT: Cross-check with hourly forecast for better accuracy
        // If forecast says snow but observation doesn't detect it, trust forecast
        try {
            const forecast = await getHourlyForecast();
            if (forecast?.hourlyForecasts?.length) {
                const currentForecast = forecast.hourlyForecasts[0];
                const forecastCondition = currentForecast.condition.toLowerCase();
                const forecastSaysSnow = forecastCondition.includes('snow') || 
                                         forecastCondition.includes('flurr') ||
                                         forecastCondition.includes('blizzard');
                const highPrecipChance = currentForecast.precipChance >= 60;
                
                // If forecast strongly indicates snow but observation missed it
                if (forecastSaysSnow && highPrecipChance && !observation.isSnowing) {
                    console.log('🌨️ Forecast indicates snow, upgrading observation');
                    observation.isSnowing = true;
                    observation.condition = currentForecast.condition;
                }
                // Also update condition from forecast if observation is generic
                else if (forecastSaysSnow && observation.condition === 'Cloudy') {
                    observation.condition = `Chance of ${currentForecast.condition}`;
                }
            }
        } catch (e) {
            // Ignore forecast enhancement errors
        }

        // Cache the observation
        cacheService.set(OBS_CACHE_KEY, observation, OBS_CACHE_TTL);
        console.log('✅ Fetched fresh EC SWOB observation:', observation.station, '| Snowing:', observation.isSnowing);

        return observation;
    } catch (error: any) {
        console.warn("⚠️ EC SWOB API failed, will use forecast model.", error.message);
        // Don't cache the failure - allow retry on next request
        return null;
    }
};

/**
 * Fetch hourly forecast from Weather Canada City Page Weather API
 * Returns up to 48 hours of forecast data
 */
export const getHourlyForecast = async (): Promise<ECForecastData | null> => {
    // Check cache first
    const cached = cacheService.get<ECForecastData>(FORECAST_CACHE_KEY);
    if (cached) {
        console.log('✅ Using cached EC hourly forecast');
        return cached;
    }

    try {
        const url = `${CITYPAGE_API_BASE}?f=json&limit=1&bbox=${BBOX_QUERY}`;
        console.log('🌤️ Fetching EC hourly forecast...');
        
        const response = await axios.get(url, { timeout: 15000 });

        if (!response.data?.features?.length) {
            throw new Error("No forecast data available");
        }

        const feature = response.data.features[0];
        const props = feature.properties;

        // Parse hourly forecasts
        const hourlyGroup = props.hourlyForecastGroup;
        if (!hourlyGroup?.hourlyForecasts?.length) {
            throw new Error("No hourly forecast data in response");
        }

        const hourlyForecasts: ECHourlyForecast[] = hourlyGroup.hourlyForecasts.map((h: any) => ({
            timestamp: h.timestamp,
            temperature: h.temperature?.value?.en ?? 0,
            condition: h.condition?.en ?? 'Unknown',
            iconCode: h.iconCode?.value ?? 0,
            precipChance: h.lop?.value?.en ?? 0,
            windSpeed: h.wind?.speed?.value?.en ?? 0,
            windGust: h.wind?.gust?.value?.en,
            windChill: h.windChill?.value?.en
        }));

        // Sort by timestamp and remove duplicates (API sometimes returns duplicates)
        const uniqueForecasts = hourlyForecasts
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .filter((item, index, self) => 
                index === self.findIndex(t => t.timestamp === item.timestamp)
            );

        const forecastData: ECForecastData = {
            station: props.name?.en ?? 'Winnipeg',
            lastUpdated: props.lastUpdated ?? new Date().toISOString(),
            hourlyForecasts: uniqueForecasts,
            sunrise: props.riseSet?.sunrise?.en,
            sunset: props.riseSet?.sunset?.en
        };

        // Cache the forecast
        cacheService.set(FORECAST_CACHE_KEY, forecastData, FORECAST_CACHE_TTL);
        console.log(`✅ Fetched EC hourly forecast: ${uniqueForecasts.length} hours from ${forecastData.station}`);

        return forecastData;
    } catch (error: any) {
        console.warn("⚠️ EC City Page Weather API failed:", error.message);
        return null;
    }
};

/**
 * Weather Canada Icon Code to WMO Weather Code mapping
 * Reference: https://weather.gc.ca/weathericons/
 * 
 * EC Icon Codes:
 * 0-1: Sun/Clear, 2-4: Mix sun/cloud, 5-9: Cloudy variations
 * 10-13: Overcast/Fog, 14-15: Rain, 16-18: Snow/Flurries
 * 19-20: Thunderstorms, 23-25: Haze/Smoke, 26-28: Ice/Freezing
 * Night versions: 30-39 (same but night icons)
 */
export const ecIconToWmoCode = (iconCode: number): number => {
    // Handle night icons (30+) - map to day equivalents first
    const dayIcon = iconCode >= 30 ? iconCode - 30 : iconCode;
    
    switch (dayIcon) {
        case 0: case 1: return 0;   // Clear/Sunny → Clear sky
        case 2: return 1;           // Mostly sunny → Mainly clear
        case 3: return 2;           // Partly cloudy → Partly cloudy
        case 4: case 5: return 2;   // Increasing cloudiness → Partly cloudy
        case 6: case 7: case 8: return 3; // Mostly cloudy/Cloudy periods → Overcast
        case 9: case 10: return 3;  // Overcast → Overcast
        case 11: return 45;         // Light fog → Fog
        case 12: case 13: return 48; // Fog/Dense fog → Depositing rime fog
        case 14: return 61;         // Light rain → Slight rain
        case 15: return 63;         // Rain → Moderate rain
        case 16: return 71;         // Light snow/Flurries → Slight snow
        case 17: return 73;         // Snow → Moderate snow
        case 18: return 75;         // Heavy snow → Heavy snow
        case 19: return 95;         // Thunderstorm → Thunderstorm
        case 20: return 96;         // Thunderstorm with hail → Thunderstorm with hail
        case 23: case 24: return 45; // Haze/Smoke → Fog
        case 25: return 85;         // Blowing snow → Snow showers slight
        case 26: return 66;         // Freezing rain → Freezing rain light
        case 27: return 67;         // Heavy freezing rain → Freezing rain heavy
        case 28: return 56;         // Freezing drizzle → Freezing drizzle light
        default: return 3;          // Default to overcast
    }
};

/**
 * Check if it's currently night time based on sunrise/sunset
 */
export const isNightTime = (currentTime: Date, sunrise?: string, sunset?: string): boolean => {
    if (!sunrise || !sunset) {
        // Fallback: use hour-based detection (6 AM - 8 PM is daytime)
        const hour = currentTime.getHours();
        return hour < 6 || hour >= 20;
    }
    
    const sunriseDate = new Date(sunrise);
    const sunsetDate = new Date(sunset);
    
    return currentTime < sunriseDate || currentTime > sunsetDate;
};

// Helper function to check snow keywords in condition text
const checkSnowKeywords = (text: string): boolean => {
    if (!text) return false;
    const keywords = ['snow', 'snowing', 'flurries', 'blizzard', 'snowfall', 'ice crystals'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
};
