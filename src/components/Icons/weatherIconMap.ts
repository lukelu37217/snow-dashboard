/**
 * Weather Icon Mapping
 *
 * Maps Weather Canada icon codes (0-39) and WMO codes to icon types.
 * This is the single source of truth for weather condition visualization.
 *
 * References:
 * - Weather Canada: https://weather.gc.ca/weathericons/
 * - WMO: https://open-meteo.com/en/docs
 */

export type WeatherIconType =
  | 'clear'
  | 'mainly-clear'
  | 'partly-cloudy'
  | 'mostly-cloudy'
  | 'overcast'
  | 'fog'
  | 'light-rain'
  | 'rain'
  | 'heavy-rain'
  | 'light-snow'
  | 'snow'
  | 'heavy-snow'
  | 'blowing-snow'
  | 'freezing-rain'
  | 'freezing-drizzle'
  | 'thunderstorm'
  | 'rain-snow-mix'
  | 'haze';

/**
 * Weather Canada Icon Code to Icon Type
 *
 * EC Icon Codes:
 * Day (0-29):
 *   0: Sunny, 1: Mainly Sunny, 2: Mix Sun/Cloud
 *   3-5: Cloudy variations, 6-10: Overcast/Fog
 *   14-15: Rain, 16-18: Snow (light/moderate/heavy)
 *   19-20: Thunderstorms, 23-25: Haze/Smoke/Blowing Snow
 *   26-28: Ice/Freezing Rain
 * Night (30-39): Same but night icons (add 30 to day code)
 */
export const EC_ICON_TO_TYPE: Record<number, WeatherIconType> = {
  // Clear/Sunny
  0: 'clear',
  1: 'mainly-clear',

  // Partly Cloudy
  2: 'partly-cloudy',
  3: 'mostly-cloudy',
  4: 'mostly-cloudy',
  5: 'mostly-cloudy',

  // Cloudy/Overcast
  6: 'overcast',
  7: 'overcast',
  8: 'overcast',
  9: 'overcast',
  10: 'overcast',

  // Fog
  11: 'fog',
  12: 'fog',
  13: 'fog',

  // Rain
  14: 'light-rain',
  15: 'rain',

  // Snow
  16: 'light-snow',
  17: 'snow',
  18: 'heavy-snow',

  // Thunderstorm
  19: 'thunderstorm',
  20: 'thunderstorm',

  // Special conditions
  21: 'rain-snow-mix',
  22: 'rain-snow-mix',
  23: 'haze',
  24: 'haze',
  25: 'blowing-snow',

  // Freezing precipitation
  26: 'freezing-rain',
  27: 'freezing-rain',
  28: 'freezing-drizzle',
  29: 'freezing-drizzle',

  // Night variants (30-39) - same mapping, handled in getIconType()
};

/**
 * WMO Weather Code to Icon Type
 * Reference: https://open-meteo.com/en/docs
 */
export const WMO_CODE_TO_TYPE: Record<number, WeatherIconType> = {
  // Clear
  0: 'clear',
  1: 'mainly-clear',
  2: 'partly-cloudy',
  3: 'overcast',

  // Fog
  45: 'fog',
  48: 'fog',

  // Drizzle
  51: 'light-rain',
  53: 'light-rain',
  55: 'rain',
  56: 'freezing-drizzle',
  57: 'freezing-drizzle',

  // Rain
  61: 'light-rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'freezing-rain',
  67: 'freezing-rain',

  // Snow
  71: 'light-snow',
  73: 'snow',
  75: 'heavy-snow',
  77: 'light-snow',

  // Showers
  80: 'light-rain',
  81: 'rain',
  82: 'heavy-rain',
  85: 'light-snow',
  86: 'heavy-snow',

  // Thunderstorm
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

/**
 * Get icon type from EC code (handles night variants)
 */
export function getIconTypeFromEC(ecCode: number): WeatherIconType {
  // Night codes are 30+, map to day equivalent
  const dayCode = ecCode >= 30 ? ecCode - 30 : ecCode;
  return EC_ICON_TO_TYPE[dayCode] || 'overcast';
}

/**
 * Get icon type from WMO code
 */
export function getIconTypeFromWMO(wmoCode: number): WeatherIconType {
  return WMO_CODE_TO_TYPE[wmoCode] || 'overcast';
}

/**
 * Check if EC code is night variant
 */
export function isECNightIcon(ecCode: number): boolean {
  return ecCode >= 30;
}

/**
 * Determine if it's night based on hour (fallback)
 */
export function isNightHour(hour: number): boolean {
  return hour < 6 || hour >= 20;
}

/**
 * Get condition label for display
 */
export const ICON_TYPE_LABELS: Record<WeatherIconType, string> = {
  'clear': 'Clear',
  'mainly-clear': 'Mainly Clear',
  'partly-cloudy': 'Partly Cloudy',
  'mostly-cloudy': 'Mostly Cloudy',
  'overcast': 'Cloudy',
  'fog': 'Fog',
  'light-rain': 'Light Rain',
  'rain': 'Rain',
  'heavy-rain': 'Heavy Rain',
  'light-snow': 'Light Snow',
  'snow': 'Snow',
  'heavy-snow': 'Heavy Snow',
  'blowing-snow': 'Blowing Snow',
  'freezing-rain': 'Freezing Rain',
  'freezing-drizzle': 'Freezing Drizzle',
  'thunderstorm': 'Thunderstorm',
  'rain-snow-mix': 'Rain/Snow Mix',
  'haze': 'Haze',
};
