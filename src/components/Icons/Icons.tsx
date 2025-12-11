/**
 * Icon Components - Replace all emojis with scalable SVG icons
 */

import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
}

// Snow Icon
export const SnowIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L12 22M12 2L8 6M12 2L16 6M12 22L8 18M12 22L16 18M2 12L22 12M2 12L6 8M2 12L6 16M22 12L18 8M22 12L18 16M6 6L18 18M6 6L4 8M6 6L8 4M18 18L20 16M18 18L16 20M6 18L18 6M6 18L4 16M6 18L8 20M18 6L20 8M18 6L16 4"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Alert Icon
export const AlertIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.9011 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.9011 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Refresh Icon
export const RefreshIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.28536 17.9845 5.27542C16.8482 4.26548 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7345 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Radar Icon
export const RadarIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
        <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" fill={color}/>
        <path d="M12 2C12 2 12 12 22 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Download Icon
export const DownloadIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Clock Icon
export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Calendar Icon
export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2"/>
    </svg>
);

// Temperature Icon
export const TemperatureIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M14 14.76V3.5C14 2.83696 13.7366 2.20107 13.2678 1.73223C12.7989 1.26339 12.163 1 11.5 1C10.837 1 10.2011 1.26339 9.73223 1.73223C9.26339 2.20107 9 2.83696 9 3.5V14.76C8.36822 15.1823 7.8626 15.7721 7.53721 16.4644C7.21181 17.1568 7.07914 17.9253 7.15324 18.6859C7.22734 19.4464 7.50524 20.1718 7.95617 20.7836C8.40711 21.3955 9.0127 21.8712 9.70647 22.1603C10.4002 22.4493 11.1575 22.5411 11.8981 22.4265C12.6387 22.312 13.335 21.9955 13.9152 21.5104C14.4954 21.0253 14.9388 20.3896 15.1984 19.6709C15.458 18.9521 15.5245 18.1764 15.3916 17.4229"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 19C13.1046 19 14 18.1046 14 17C14 15.8954 13.1046 15 12 15C10.8954 15 10 15.8954 10 17C10 18.1046 10.8954 19 12 19Z"
            fill={color}/>
    </svg>
);

// Wind Icon
export const WindIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M9.59 4.59C9.96 4.21 10.46 4 11 4C11.54 4 12.04 4.21 12.41 4.59C12.79 4.96 13 5.46 13 6C13 6.54 12.79 7.04 12.41 7.41M17.59 6.59C17.96 6.21 18.46 6 19 6C19.54 6 20.04 6.21 20.41 6.59C20.79 6.96 21 7.46 21 8C21 8.54 20.79 9.04 20.41 9.41C20.04 9.79 19.54 10 19 10H3M14.59 16.59C14.96 16.21 15.46 16 16 16C16.54 16 17.04 16.21 17.41 16.59C17.79 16.96 18 17.46 18 18C18 18.54 17.79 19.04 17.41 19.41C17.04 19.79 16.54 20 16 20H3"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Location Icon
export const LocationIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2"/>
    </svg>
);

// Check Icon
export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Close Icon
export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Chart Icon
export const ChartIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 3V21H21M7 16L12 11L16 15L21 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Info Icon
export const InfoIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
        <path d="M12 16V12M12 8H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Droplet Icon (for precipitation)
export const DropletIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2.69L17.66 8.35C18.5 9.19 19.16 10.21 19.58 11.33C20 12.45 20.17 13.64 20.08 14.83C19.99 16.02 19.64 17.17 19.06 18.21C18.48 19.25 17.67 20.16 16.69 20.87C15.71 21.58 14.58 22.08 13.38 22.33C12.18 22.58 10.94 22.58 9.74 22.33C8.54 22.08 7.41 21.58 6.43 20.87C5.45 20.16 4.64 19.25 4.06 18.21C3.48 17.17 3.13 16.02 3.04 14.83C2.95 13.64 3.12 12.45 3.54 11.33C3.96 10.21 4.62 9.19 5.46 8.35L12 2.69Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Layers Icon (for snow depth)
export const LayersIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="2 17 12 22 22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="2 12 12 17 22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Spinner Icon (for loading)
export const SpinnerIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" opacity="0.25"/>
        <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    </svg>
);
