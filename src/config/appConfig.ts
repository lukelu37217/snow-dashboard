/**
 * Application Configuration
 * 
 * IMPORTANT: Replace the placeholder API keys with your own!
 * 
 * Get your free Windy API key at: https://api.windy.com/keys
 * - Sign up / Sign in
 * - Create a new key for "Map Forecast API"
 * - Use the "Testing" tier (free) for development
 * 
 * For production, consider upgrading to Professional tier (€990/year)
 */

export const config = {
    // Windy.com Map Forecast API
    // Documentation: https://api.windy.com/map-forecast/docs
    windy: {
        apiKey: import.meta.env.VITE_WINDY_API_KEY || 'YOUR_WINDY_API_KEY_HERE',
        
        // Default overlay options:
        // FREE Testing tier: 'wind' | 'temp' | 'pressure'
        // Professional tier adds: 'rain' | 'snow' | 'clouds' | 'gust' | 'rh' | etc.
        defaultOverlay: 'wind' as const,
        
        // Note: Testing tier is for DEVELOPMENT ONLY
        // Production use requires Professional license
    },

    // Map settings
    map: {
        // Winnipeg, Manitoba center coordinates
        center: {
            lat: 49.8951,
            lon: -97.1384,
        },
        defaultZoom: 11,
    },

    // Data refresh intervals (in milliseconds)
    refresh: {
        weather: 30 * 60 * 1000,  // 30 minutes
        radar: 5 * 60 * 1000,     // 5 minutes (not used with Windy - it auto-updates)
    }
};

export default config;
