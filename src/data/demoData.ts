/**
 * Demo Weather Data for Testing and Development
 * Use this when API is rate-limited or for demonstration purposes
 */

import type { WeatherData, DetailedForecast, HybridWeatherResult } from '../services/weatherService';

// Realistic snow scenario for Winnipeg winter
export const DEMO_CITY_WEATHER: HybridWeatherResult = {
    current: {
        temperature: -9,
        isSnowing: true,
        condition: "Snow",
        source: 'observation' as const
    },
    forecast: {
        current: {
            temperature_2m: -9,
            apparent_temperature: -15,
            snowfall: 0.8,
            wind_gusts_10m: 26,
            weather_code: 73
        },
        hourly: {
            time: Array.from({ length: 168 }, (_, i) => {
                const date = new Date();
                date.setHours(date.getHours() + i);
                return date.toISOString();
            }),
            temperature_2m: Array.from({ length: 168 }, (_, i) => -10 + Math.sin(i / 4) * 5),
            apparent_temperature: Array.from({ length: 168 }, (_, i) => -15 + Math.sin(i / 4) * 5),
            snowfall: Array.from({ length: 168 }, (_, i) => {
                // Heavy snow for first 12 hours, then tapering off
                if (i < 6) return 1.2 + Math.random() * 0.8;
                if (i < 12) return 0.6 + Math.random() * 0.4;
                if (i < 18) return 0.2 + Math.random() * 0.2;
                return 0;
            }),
            wind_gusts_10m: Array.from({ length: 168 }, (_, i) => 20 + Math.random() * 20)
        },
        daily: {
            time: Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return date.toISOString().split('T')[0];
            }),
            temperature_2m_max: [-5, -8, -12, -10, -6, -4, -2],
            temperature_2m_min: [-15, -18, -20, -19, -16, -14, -12],
            snowfall_sum: [8.5, 2.3, 0.5, 0, 0, 1.2, 0]
        }
    },
    snowRemoval: {
        needsRemoval: true,
        priority: 'high',
        snowDepthCm: 12.5,
        reasons: ['Heavy snowfall expected (>5cm)', 'High priority commercial routes']
    }
};

// Demo data for 14 core neighborhoods
export const DEMO_NEIGHBORHOOD_DATA: Record<string, WeatherData> = {
    // High Priority - Commercial Plow (>5cm)
    '1288': { // Riverview
        temperature: -9,
        snowfall: 1.2,
        snowAccumulation24h: 7.8,
        windSpeed: 15,
        windGusts: 28,
        apparentTemperature: -16,
        snowRemoval: {
            needsRemoval: true,
            priority: 'high',
            snowDepthCm: 14.2,
            reasons: ['24h accumulation exceeds 5cm threshold', 'Commercial route']
        }
    },
    '204': { // Meadowood
        temperature: -10,
        snowfall: 1.1,
        snowAccumulation24h: 6.5,
        windSpeed: 14,
        windGusts: 25,
        apparentTemperature: -17,
        snowRemoval: {
            needsRemoval: true,
            priority: 'high',
            snowDepthCm: 13.1,
            reasons: ['24h accumulation exceeds 5cm threshold']
        }
    },
    '1723': { // Bridgwater Lakes
        temperature: -8,
        snowfall: 0.9,
        snowAccumulation24h: 5.2,
        windSpeed: 16,
        windGusts: 30,
        apparentTemperature: -15,
        snowRemoval: {
            needsRemoval: true,
            priority: 'high',
            snowDepthCm: 11.8,
            reasons: ['24h accumulation exceeds 5cm threshold', 'High wind gusts']
        }
    },

    // Medium Priority - Residential Run (1-5cm)
    '1722': { // Bridgwater Trails
        temperature: -9,
        snowfall: 0.5,
        snowAccumulation24h: 3.2,
        windSpeed: 12,
        windGusts: 22,
        apparentTemperature: -14,
        snowRemoval: {
            needsRemoval: true,
            priority: 'medium',
            snowDepthCm: 8.5,
            reasons: ['24h accumulation between 1-5cm', 'Residential area']
        }
    },
    '305': { // Osborne Village
        temperature: -8,
        snowfall: 0.4,
        snowAccumulation24h: 2.8,
        windSpeed: 11,
        windGusts: 20,
        apparentTemperature: -13,
        snowRemoval: {
            needsRemoval: true,
            priority: 'medium',
            snowDepthCm: 7.2,
            reasons: ['24h accumulation between 1-5cm']
        }
    },
    '412': { // River Heights
        temperature: -9,
        snowfall: 0.6,
        snowAccumulation24h: 3.8,
        windSpeed: 13,
        windGusts: 24,
        apparentTemperature: -15,
        snowRemoval: {
            needsRemoval: true,
            priority: 'medium',
            snowDepthCm: 9.1,
            reasons: ['24h accumulation between 1-5cm', 'Residential streets']
        }
    },
    '520': { // Wolseley
        temperature: -8,
        snowfall: 0.3,
        snowAccumulation24h: 2.1,
        windSpeed: 10,
        windGusts: 18,
        apparentTemperature: -12,
        snowRemoval: {
            needsRemoval: true,
            priority: 'medium',
            snowDepthCm: 6.4,
            reasons: ['24h accumulation between 1-5cm']
        }
    },

    // Low Priority - No Action (<1cm)
    '101': { // Downtown
        temperature: -7,
        snowfall: 0.2,
        snowAccumulation24h: 0.8,
        windSpeed: 8,
        windGusts: 15,
        apparentTemperature: -11,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 3.2,
            reasons: []
        }
    },
    '225': { // The Forks
        temperature: -7,
        snowfall: 0.1,
        snowAccumulation24h: 0.5,
        windSpeed: 7,
        windGusts: 12,
        apparentTemperature: -10,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 2.1,
            reasons: []
        }
    },
    '350': { // St. Boniface
        temperature: -8,
        snowfall: 0.2,
        snowAccumulation24h: 0.6,
        windSpeed: 9,
        windGusts: 16,
        apparentTemperature: -12,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 2.8,
            reasons: []
        }
    },
    '445': { // Crescentwood
        temperature: -9,
        snowfall: 0.3,
        snowAccumulation24h: 0.9,
        windSpeed: 10,
        windGusts: 17,
        apparentTemperature: -13,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 3.5,
            reasons: []
        }
    },
    '580': { // Fort Rouge
        temperature: -8,
        snowfall: 0.1,
        snowAccumulation24h: 0.4,
        windSpeed: 8,
        windGusts: 14,
        apparentTemperature: -11,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 2.0,
            reasons: []
        }
    },
    '620': { // Armstrong Point
        temperature: -7,
        snowfall: 0.2,
        snowAccumulation24h: 0.7,
        windSpeed: 9,
        windGusts: 15,
        apparentTemperature: -11,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 2.9,
            reasons: []
        }
    },
    '710': { // Lord Roberts
        temperature: -8,
        snowfall: 0.2,
        snowAccumulation24h: 0.8,
        windSpeed: 9,
        windGusts: 16,
        apparentTemperature: -12,
        snowRemoval: {
            needsRemoval: false,
            priority: 'low',
            snowDepthCm: 3.1,
            reasons: []
        }
    }
};

/**
 * Check if demo mode is enabled
 */
export const isDemoMode = (): boolean => {
    return localStorage.getItem('demoMode') === 'true';
};

/**
 * Enable demo mode
 */
export const enableDemoMode = (): void => {
    localStorage.setItem('demoMode', 'true');
    console.log('🎭 Demo mode enabled');
};

/**
 * Disable demo mode
 */
export const disableDemoMode = (): void => {
    localStorage.removeItem('demoMode');
    console.log('✅ Demo mode disabled - using real API');
};
