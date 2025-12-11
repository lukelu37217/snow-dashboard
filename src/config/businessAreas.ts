/**
 * Core Business Areas Configuration
 * Only these neighborhoods will be loaded and monitored for snow removal
 * This significantly reduces API calls and improves performance
 */

export const CORE_BUSINESS_AREAS = [
    // Downtown Core
    "Downtown",
    "The Forks",
    "Exchange District",
    "Chinatown",

    // Central Neighborhoods (within red box area from screenshot)
    "Osborne Village",
    "River Heights",
    "Wolseley",
    "West Broadway",
    "Armstrong Point",
    "Crescentwood",
    "Lord Roberts",

    // North Central
    "North Point Douglas",
    "Centennial",
    "William Whyte",

    // West Central
    "Spence",
    "West End",
    "Daniel McIntyre",

    // East Central
    "St. Boniface",
    "Norwood",
    "St. Vital Centre",

    // South Central
    "Fort Rouge",
    "Riverview",
    "Fort Garry",

    // Add or remove neighborhoods based on your actual service areas
];

/**
 * Enable/Disable core area filtering
 * Set to false to load ALL neighborhoods (not recommended for production)
 */
export const ENABLE_CORE_AREA_FILTER = true;

/**
 * Maximum number of neighborhoods to load (safety limit)
 */
export const MAX_NEIGHBORHOODS = 50;
