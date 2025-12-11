
import axios from 'axios';
import { cacheService } from './cacheService';

// NEW API: Using Weather Canada SWOB (Surface Weather Observations) real-time API
// API Documentation: https://api.weather.gc.ca/
// Collection: swob-realtime (Surface Weather Observation Bulletins)
const SWOB_API_BASE = 'https://api.weather.gc.ca/collections/swob-realtime/items';
const OBS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes - increased to reduce API calls
const OBS_CACHE_KEY = 'env_canada_observation';

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

        // If total precip > rainfall, then we have snowfall
        const snowfallAmount = Math.max(0, pcpnPast1hr - rnflPast1hr);

        // Determine if it's currently snowing:
        // 1. Recent snowfall detected (precipitation when temp < 0)
        // 2. Or recent precipitation with cold temperature
        const isSnowing = (snowfallAmount > 0) || (pcpnPast1hr > 0 && temperature < 0);

        // Generate condition string
        let condition = "Clear";
        if (isSnowing) {
            condition = "Snow";
        } else if (pcpnPast1hr > 0) {
            condition = temperature < 0 ? "Snow" : "Rain";
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

        // Cache the observation
        cacheService.set(OBS_CACHE_KEY, observation, OBS_CACHE_TTL);
        console.log('✅ Fetched fresh EC SWOB observation:', observation.station);

        return observation;
    } catch (error: any) {
        console.warn("⚠️ EC SWOB API failed, will use forecast model.", error.message);
        // Don't cache the failure - allow retry on next request
        return null;
    }
};

const checkSnowKeywords = (text: string): boolean => {
    if (!text) return false;
    const keywords = ['snow', 'snowing', 'flurries', 'blizzard', 'snowfall', 'ice crystals'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
};
