/**
 * Weather Icons - Custom SVG icons matching Weather Canada style
 *
 * Unified weather icon system for both desktop and mobile.
 * Uses EC code mapping from weatherIconMap.ts
 */

import React from 'react';
import {
  WeatherIconType,
  getIconTypeFromEC,
  getIconTypeFromWMO,
  isECNightIcon,
  isNightHour,
} from './weatherIconMap';

interface WeatherIconProps {
  /** Weather Canada icon code (0-39) */
  ecCode?: number;
  /** WMO weather code (Open-Meteo) */
  wmoCode?: number;
  /** Force night mode */
  isNight?: boolean;
  /** Icon size in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
}

// Color palette
const COLORS = {
  sun: '#FBBF24',
  sunRays: '#F59E0B',
  moon: '#CBD5E1',
  moonCrater: '#94A3B8',
  cloud: '#94A3B8',
  cloudDark: '#64748B',
  cloudLight: '#CBD5E1',
  rain: '#3B82F6',
  snow: '#60A5FA',
  ice: '#06B6D4',
  lightning: '#FACC15',
  fog: '#9CA3AF',
  wind: '#64748B',
};

// Sun icon (clear day)
const SunIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="5" fill={COLORS.sun} />
    <g stroke={COLORS.sunRays} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
  </svg>
);

// Moon icon (clear night)
const MoonIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill={COLORS.moon}
      stroke={COLORS.moonCrater}
      strokeWidth="1"
    />
    <circle cx="10" cy="10" r="1.5" fill={COLORS.moonCrater} opacity="0.5" />
    <circle cx="14" cy="14" r="1" fill={COLORS.moonCrater} opacity="0.4" />
  </svg>
);

// Cloud base shape
const CloudShape: React.FC<{ fill?: string; x?: number; y?: number; scale?: number }> = ({
  fill = COLORS.cloud,
  x = 0,
  y = 0,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path
      d="M19.5 16H5.5C3.57 16 2 14.43 2 12.5C2 10.77 3.28 9.33 4.95 9.07C5.15 6.77 7.1 5 9.5 5C10.74 5 11.86 5.49 12.69 6.28C13.32 5.49 14.35 5 15.5 5C17.74 5 19.56 6.68 19.93 8.85C21.15 9.22 22 10.34 22 11.64C22 12.58 21.59 13.43 20.94 14.01C20.46 14.69 19.77 15.21 18.97 15.51"
      fill={fill}
    />
  </g>
);

// Sun with small cloud (mainly clear)
const SunWithCloudIcon: React.FC<{ size: number; isNight?: boolean }> = ({ size, isNight }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {isNight ? (
      <g transform="translate(-2, -2) scale(0.7)">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={COLORS.moon} />
      </g>
    ) : (
      <>
        <circle cx="10" cy="8" r="4" fill={COLORS.sun} />
        <g stroke={COLORS.sunRays} strokeWidth="1.5" strokeLinecap="round">
          <line x1="10" y1="1" x2="10" y2="2.5" />
          <line x1="4.5" y1="3.5" x2="5.5" y2="4.5" />
          <line x1="2" y1="8" x2="3.5" y2="8" />
          <line x1="15.5" y1="3.5" x2="14.5" y2="4.5" />
        </g>
      </>
    )}
    <path
      d="M20 18H8C6.34 18 5 16.66 5 15C5 13.55 6.03 12.32 7.4 12.07C7.58 10.33 9.06 9 10.85 9C11.82 9 12.7 9.4 13.34 10.04C13.84 9.4 14.63 9 15.5 9C17.28 9 18.74 10.3 18.96 12C20.09 12.21 21 13.19 21 14.36C21 15.83 19.82 17.02 18.36 17.02"
      fill={COLORS.cloud}
    />
  </svg>
);

// Partly cloudy (sun/moon half covered)
const PartlyCloudyIcon: React.FC<{ size: number; isNight?: boolean }> = ({ size, isNight }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {isNight ? (
      <path
        d="M16 6.79A6 6 0 1 1 9.21 0 4.67 4.67 0 0 0 16 6.79z"
        fill={COLORS.moon}
        transform="translate(2, 1) scale(0.8)"
      />
    ) : (
      <>
        <circle cx="9" cy="7" r="4.5" fill={COLORS.sun} />
        <g stroke={COLORS.sunRays} strokeWidth="1.5" strokeLinecap="round">
          <line x1="9" y1="0" x2="9" y2="2" />
          <line x1="3" y1="3" x2="4.5" y2="4.5" />
          <line x1="0" y1="7" x2="2" y2="7" />
        </g>
      </>
    )}
    <path
      d="M20 19H6C4.07 19 2.5 17.43 2.5 15.5C2.5 13.77 3.78 12.33 5.45 12.07C5.65 9.77 7.6 8 10 8C11.24 8 12.36 8.49 13.19 9.28C13.82 8.49 14.85 8 16 8C18.43 8 20.4 9.83 20.46 12.22C21.85 12.58 22.89 13.83 22.89 15.31C22.89 17.09 21.44 18.54 19.66 18.54"
      fill={COLORS.cloud}
    />
  </svg>
);

// Mostly cloudy (cloud with sun peek)
const MostlyCloudyIcon: React.FC<{ size: number; isNight?: boolean }> = ({ size, isNight }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {isNight ? (
      <circle cx="18" cy="5" r="3" fill={COLORS.moon} opacity="0.7" />
    ) : (
      <circle cx="18" cy="5" r="3" fill={COLORS.sun} />
    )}
    <path
      d="M19 19H5C2.79 19 1 17.21 1 15C1 13.04 2.43 11.41 4.32 11.08C4.56 8.45 6.74 6.4 9.4 6.4C10.82 6.4 12.1 6.97 13.04 7.88C13.76 6.97 14.92 6.4 16.2 6.4C18.77 6.4 20.87 8.41 20.97 10.95C22.33 11.34 23.33 12.58 23.33 14.05C23.33 15.88 21.86 17.35 20.03 17.35"
      fill={COLORS.cloud}
    />
  </svg>
);

// Overcast (full cloud)
const OvercastIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M19.5 18H4.5C2.57 18 1 16.43 1 14.5C1 12.77 2.28 11.33 3.95 11.07C4.15 8.77 6.1 7 8.5 7C9.74 7 10.86 7.49 11.69 8.28C12.32 7.49 13.35 7 14.5 7C16.93 7 18.9 8.83 18.96 11.22C20.32 11.58 21.36 12.83 21.36 14.31C21.36 16.09 19.91 17.54 18.13 17.54"
      fill={COLORS.cloudDark}
    />
    <path
      d="M16 14H7C5.62 14 4.5 12.88 4.5 11.5C4.5 10.27 5.38 9.24 6.55 9.04C6.69 7.54 7.95 6.38 9.48 6.38C10.26 6.38 10.97 6.68 11.5 7.18C11.9 6.68 12.53 6.38 13.22 6.38C14.72 6.38 15.92 7.51 15.97 8.99C16.86 9.17 17.54 9.95 17.54 10.88C17.54 11.95 16.67 12.82 15.6 12.82"
      fill={COLORS.cloud}
      transform="translate(2, -2)"
    />
  </svg>
);

// Fog icon
const FogIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M17 10H5C3.34 10 2 8.66 2 7C2 5.55 3.03 4.32 4.4 4.07C4.58 2.33 6.06 1 7.85 1C8.82 1 9.7 1.4 10.34 2.04C10.84 1.4 11.63 1 12.5 1C14.28 1 15.74 2.3 15.96 4C17.09 4.21 18 5.19 18 6.36C18 7.83 16.82 9.02 15.36 9.02"
      fill={COLORS.cloud}
    />
    <g stroke={COLORS.fog} strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="14" x2="21" y2="14" />
      <line x1="5" y1="18" x2="19" y2="18" />
      <line x1="7" y1="22" x2="17" y2="22" />
    </g>
  </svg>
);

// Rain drops helper
const RainDrops: React.FC<{ count: 'light' | 'normal' | 'heavy' }> = ({ count }) => {
  const drops =
    count === 'light'
      ? [{ x: 8, delay: 0 }, { x: 14, delay: 0.3 }]
      : count === 'normal'
        ? [{ x: 6, delay: 0 }, { x: 11, delay: 0.2 }, { x: 16, delay: 0.4 }]
        : [
            { x: 5, delay: 0 },
            { x: 9, delay: 0.15 },
            { x: 13, delay: 0.3 },
            { x: 17, delay: 0.45 },
          ];

  return (
    <g>
      {drops.map((drop, i) => (
        <line
          key={i}
          x1={drop.x}
          y1="16"
          x2={drop.x - 1}
          y2="20"
          stroke={COLORS.rain}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

// Light rain icon
const LightRainIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13H6C4.34 13 3 11.66 3 10C3 8.55 4.03 7.32 5.4 7.07C5.58 5.33 7.06 4 8.85 4C9.82 4 10.7 4.4 11.34 5.04C11.84 4.4 12.63 4 13.5 4C15.28 4 16.74 5.3 16.96 7C18.09 7.21 19 8.19 19 9.36C19 10.83 17.82 12.02 16.36 12.02"
      fill={COLORS.cloud}
    />
    <RainDrops count="light" />
  </svg>
);

// Rain icon
const RainIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13H6C4.34 13 3 11.66 3 10C3 8.55 4.03 7.32 5.4 7.07C5.58 5.33 7.06 4 8.85 4C9.82 4 10.7 4.4 11.34 5.04C11.84 4.4 12.63 4 13.5 4C15.28 4 16.74 5.3 16.96 7C18.09 7.21 19 8.19 19 9.36C19 10.83 17.82 12.02 16.36 12.02"
      fill={COLORS.cloudDark}
    />
    <RainDrops count="normal" />
  </svg>
);

// Heavy rain icon
const HeavyRainIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M19 12H5C3.07 12 1.5 10.43 1.5 8.5C1.5 6.77 2.78 5.33 4.45 5.07C4.65 2.77 6.6 1 9 1C10.24 1 11.36 1.49 12.19 2.28C12.82 1.49 13.85 1 15 1C17.43 1 19.4 2.83 19.46 5.22C20.82 5.58 21.86 6.83 21.86 8.31C21.86 10.09 20.41 11.54 18.63 11.54"
      fill={COLORS.cloudDark}
    />
    <RainDrops count="heavy" />
  </svg>
);

// Snow flakes helper
const SnowFlakes: React.FC<{ count: 'light' | 'normal' | 'heavy' }> = ({ count }) => {
  const flakes =
    count === 'light'
      ? [{ x: 8, y: 17 }, { x: 15, y: 19 }]
      : count === 'normal'
        ? [{ x: 6, y: 17 }, { x: 11, y: 20 }, { x: 16, y: 17 }]
        : [
            { x: 5, y: 16 },
            { x: 9, y: 19 },
            { x: 13, y: 16 },
            { x: 17, y: 19 },
            { x: 7, y: 22 },
            { x: 15, y: 22 },
          ];

  return (
    <g>
      {flakes.map((flake, i) => (
        <g key={i} transform={`translate(${flake.x}, ${flake.y})`}>
          <circle r="1.5" fill={COLORS.snow} />
        </g>
      ))}
    </g>
  );
};

// Light snow icon
const LightSnowIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13H6C4.34 13 3 11.66 3 10C3 8.55 4.03 7.32 5.4 7.07C5.58 5.33 7.06 4 8.85 4C9.82 4 10.7 4.4 11.34 5.04C11.84 4.4 12.63 4 13.5 4C15.28 4 16.74 5.3 16.96 7C18.09 7.21 19 8.19 19 9.36C19 10.83 17.82 12.02 16.36 12.02"
      fill={COLORS.cloud}
    />
    <SnowFlakes count="light" />
  </svg>
);

// Snow icon
const SnowIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 13H6C4.34 13 3 11.66 3 10C3 8.55 4.03 7.32 5.4 7.07C5.58 5.33 7.06 4 8.85 4C9.82 4 10.7 4.4 11.34 5.04C11.84 4.4 12.63 4 13.5 4C15.28 4 16.74 5.3 16.96 7C18.09 7.21 19 8.19 19 9.36C19 10.83 17.82 12.02 16.36 12.02"
      fill={COLORS.cloudDark}
    />
    <SnowFlakes count="normal" />
  </svg>
);

// Heavy snow icon
const HeavySnowIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M19 12H5C3.07 12 1.5 10.43 1.5 8.5C1.5 6.77 2.78 5.33 4.45 5.07C4.65 2.77 6.6 1 9 1C10.24 1 11.36 1.49 12.19 2.28C12.82 1.49 13.85 1 15 1C17.43 1 19.4 2.83 19.46 5.22C20.82 5.58 21.86 6.83 21.86 8.31C21.86 10.09 20.41 11.54 18.63 11.54"
      fill={COLORS.cloudDark}
    />
    <SnowFlakes count="heavy" />
  </svg>
);

// Blowing snow icon
const BlowingSnowIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 11H6C4.34 11 3 9.66 3 8C3 6.55 4.03 5.32 5.4 5.07C5.58 3.33 7.06 2 8.85 2C9.82 2 10.7 2.4 11.34 3.04C11.84 2.4 12.63 2 13.5 2C15.28 2 16.74 3.3 16.96 5C18.09 5.21 19 6.19 19 7.36C19 8.83 17.82 10.02 16.36 10.02"
      fill={COLORS.cloudDark}
    />
    {/* Wind lines */}
    <g stroke={COLORS.wind} strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 14h8c1.1 0 2 .45 2 1s-.9 1-2 1H5" />
      <path d="M5 18h6c.83 0 1.5.34 1.5.75s-.67.75-1.5.75H7" />
    </g>
    {/* Snow flakes being blown */}
    <g fill={COLORS.snow}>
      <circle cx="16" cy="15" r="1.5" />
      <circle cx="19" cy="17" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <circle cx="21" cy="14" r="1" />
      <circle cx="22" cy="19" r="1" />
    </g>
  </svg>
);

// Freezing rain icon
const FreezingRainIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 12H6C4.34 12 3 10.66 3 9C3 7.55 4.03 6.32 5.4 6.07C5.58 4.33 7.06 3 8.85 3C9.82 3 10.7 3.4 11.34 4.04C11.84 3.4 12.63 3 13.5 3C15.28 3 16.74 4.3 16.96 6C18.09 6.21 19 7.19 19 8.36C19 9.83 17.82 11.02 16.36 11.02"
      fill={COLORS.cloudDark}
    />
    {/* Rain drops */}
    <g stroke={COLORS.rain} strokeWidth="2" strokeLinecap="round">
      <line x1="7" y1="15" x2="6" y2="18" />
      <line x1="12" y1="15" x2="11" y2="18" />
      <line x1="17" y1="15" x2="16" y2="18" />
    </g>
    {/* Ice crystals */}
    <g fill={COLORS.ice}>
      <polygon points="7,21 6,23 8,23" />
      <polygon points="12,20 11,22 13,22" />
      <polygon points="17,21 16,23 18,23" />
    </g>
  </svg>
);

// Freezing drizzle icon
const FreezingDrizzleIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 12H6C4.34 12 3 10.66 3 9C3 7.55 4.03 6.32 5.4 6.07C5.58 4.33 7.06 3 8.85 3C9.82 3 10.7 3.4 11.34 4.04C11.84 3.4 12.63 3 13.5 3C15.28 3 16.74 4.3 16.96 6C18.09 6.21 19 7.19 19 8.36C19 9.83 17.82 11.02 16.36 11.02"
      fill={COLORS.cloud}
    />
    {/* Light rain drops */}
    <g stroke={COLORS.rain} strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="15" x2="7.5" y2="17" />
      <line x1="14" y1="15" x2="13.5" y2="17" />
    </g>
    {/* Ice crystals */}
    <g fill={COLORS.ice}>
      <polygon points="8,19 7,21 9,21" />
      <polygon points="14,19 13,21 15,21" />
    </g>
  </svg>
);

// Thunderstorm icon
const ThunderstormIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M19 11H5C3.07 11 1.5 9.43 1.5 7.5C1.5 5.77 2.78 4.33 4.45 4.07C4.65 1.77 6.6 0 9 0C10.24 0 11.36 0.49 12.19 1.28C12.82 0.49 13.85 0 15 0C17.43 0 19.4 1.83 19.46 4.22C20.82 4.58 21.86 5.83 21.86 7.31C21.86 9.09 20.41 10.54 18.63 10.54"
      fill={COLORS.cloudDark}
    />
    {/* Lightning bolt */}
    <polygon points="13,12 9,18 12,18 10,24 16,16 12,16 14,12" fill={COLORS.lightning} />
  </svg>
);

// Rain/Snow mix icon
const RainSnowMixIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M18 12H6C4.34 12 3 10.66 3 9C3 7.55 4.03 6.32 5.4 6.07C5.58 4.33 7.06 3 8.85 3C9.82 3 10.7 3.4 11.34 4.04C11.84 3.4 12.63 3 13.5 3C15.28 3 16.74 4.3 16.96 6C18.09 6.21 19 7.19 19 8.36C19 9.83 17.82 11.02 16.36 11.02"
      fill={COLORS.cloudDark}
    />
    {/* Rain drops */}
    <g stroke={COLORS.rain} strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="15" x2="5" y2="19" />
      <line x1="14" y1="15" x2="13" y2="19" />
    </g>
    {/* Snow flakes */}
    <g fill={COLORS.snow}>
      <circle cx="10" cy="17" r="1.5" />
      <circle cx="18" cy="17" r="1.5" />
      <circle cx="8" cy="21" r="1.5" />
      <circle cx="16" cy="21" r="1.5" />
    </g>
  </svg>
);

// Haze icon
const HazeIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" fill={COLORS.sun} opacity="0.6" />
    <g stroke={COLORS.fog} strokeWidth="2" strokeLinecap="round" opacity="0.7">
      <line x1="3" y1="14" x2="21" y2="14" />
      <line x1="5" y1="18" x2="19" y2="18" />
      <line x1="7" y1="22" x2="17" y2="22" />
    </g>
  </svg>
);

// Icon component map
const ICON_COMPONENTS: Record<WeatherIconType, React.FC<{ size: number; isNight?: boolean }>> = {
  clear: ({ size, isNight }) => (isNight ? <MoonIcon size={size} /> : <SunIcon size={size} />),
  'mainly-clear': SunWithCloudIcon,
  'partly-cloudy': PartlyCloudyIcon,
  'mostly-cloudy': MostlyCloudyIcon,
  overcast: OvercastIcon,
  fog: FogIcon,
  'light-rain': LightRainIcon,
  rain: RainIcon,
  'heavy-rain': HeavyRainIcon,
  'light-snow': LightSnowIcon,
  snow: SnowIcon,
  'heavy-snow': HeavySnowIcon,
  'blowing-snow': BlowingSnowIcon,
  'freezing-rain': FreezingRainIcon,
  'freezing-drizzle': FreezingDrizzleIcon,
  thunderstorm: ThunderstormIcon,
  'rain-snow-mix': RainSnowMixIcon,
  haze: HazeIcon,
};

/**
 * Unified Weather Icon Component
 *
 * Usage:
 * <WeatherIcon ecCode={17} size={24} />  // EC code for snow
 * <WeatherIcon wmoCode={73} size={24} /> // WMO code for snow
 * <WeatherIcon ecCode={30} size={24} /> // Night clear (auto-detects night)
 */
export const WeatherIcon: React.FC<WeatherIconProps> = ({
  ecCode,
  wmoCode,
  isNight: forceNight,
  size = 24,
  className = '',
}) => {
  // Determine icon type
  let iconType: WeatherIconType = 'overcast';

  if (ecCode !== undefined) {
    iconType = getIconTypeFromEC(ecCode);
  } else if (wmoCode !== undefined) {
    iconType = getIconTypeFromWMO(wmoCode);
  }

  // Determine if night
  let isNight = forceNight;
  if (isNight === undefined) {
    if (ecCode !== undefined) {
      isNight = isECNightIcon(ecCode);
    } else {
      isNight = isNightHour(new Date().getHours());
    }
  }

  const IconComponent = ICON_COMPONENTS[iconType];

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <IconComponent size={size} isNight={isNight} />
    </span>
  );
};

// Export individual icons for direct use
export {
  SunIcon,
  MoonIcon,
  SunWithCloudIcon,
  PartlyCloudyIcon,
  MostlyCloudyIcon,
  OvercastIcon,
  FogIcon,
  LightRainIcon,
  RainIcon,
  HeavyRainIcon,
  LightSnowIcon,
  SnowIcon as SnowWeatherIcon,
  HeavySnowIcon,
  BlowingSnowIcon,
  FreezingRainIcon,
  FreezingDrizzleIcon,
  ThunderstormIcon,
  RainSnowMixIcon,
  HazeIcon,
};

export default WeatherIcon;
