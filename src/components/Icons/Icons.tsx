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

// Layers Icon (for snow depth / radar layers)
export const LayersIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="2 17 12 22 22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="2 12 12 17 22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Clipboard Icon (for mission brief / summary)
export const ClipboardIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke={color} strokeWidth="2"/>
        <line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="14" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="18" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Stopwatch Icon (for timing / snow ends at)
export const StopwatchIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2"/>
        <path d="M12 9V13L14.5 15.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 2H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 2V5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M19 6L20.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Spinner Icon (for loading)
export const SpinnerIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="4" opacity="0.25"/>
        <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    </svg>
);

// Menu Icon (hamburger menu for mobile)
export const MenuIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Chevron Up Icon (for bottom sheet)
export const ChevronUpIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M18 15L12 9L6 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Chevron Down Icon (for bottom sheet)
export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Chevron Right Icon
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Chevron Left Icon
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Map Pin Icon
export const MapPinIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2"/>
    </svg>
);

// Blowing Snow Icon (UI version - for status indicators)
export const BlowingSnowIconUI: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        {/* Wind lines */}
        <path d="M9.59 4.59C9.96 4.21 10.46 4 11 4C12.1 4 13 4.9 13 6C13 7.1 12.1 8 11 8H2"
            stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M12.59 10.59C12.96 10.21 13.46 10 14 10C15.1 10 16 10.9 16 12C16 13.1 15.1 14 14 14H2"
            stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* Snowflakes */}
        <circle cx="19" cy="7" r="1.5" fill={color}/>
        <circle cx="21" cy="12" r="1.5" fill={color}/>
        <circle cx="18" cy="17" r="1.5" fill={color}/>
        <circle cx="22" cy="17" r="1" fill={color}/>
    </svg>
);

// Bell Icon (for notifications)
export const BellIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Bell Off Icon (notifications disabled)
export const BellOffIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.63 13C18.8657 14.3044 19.3761 15.5454 20.13 16.64C20.13 16.64 20.25 16.82 20.31 16.92C20.37 17.02 20.46 17.14 20.49 17.25C20.55 17.46 20.55 17.69 20.49 17.9C20.43 18.11 20.31 18.29 20.15 18.43C19.99 18.57 19.79 18.66 19.58 18.69C19.37 18.72 19.15 18.69 18.95 18.6L3 17"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.26 6.26C6.09066 6.8037 6.00268 7.37013 6 7.94V8C6 15 3 17 3 17H13"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.9091 2 9.85212 2.28435 8.91406 2.81802"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Settings Icon (gear)
export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
        <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Cloud Icon
export const CloudIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M18 10H16.74C16.3659 8.55183 15.5928 7.23801 14.5086 6.2044C13.4245 5.17078 12.0727 4.46267 10.6069 4.16061C9.14113 3.85855 7.62012 3.97428 6.21659 4.49527C4.81305 5.01626 3.58363 5.92165 2.66709 7.10754C1.75055 8.29344 1.18434 9.71295 1.03046 11.2046C0.876588 12.6962 1.14076 14.2004 1.79379 15.5509C2.44682 16.9015 3.46332 18.0446 4.72866 18.8533C5.99401 19.662 7.45836 20.1043 8.96 20.13H18C19.3261 20.13 20.5979 19.6027 21.5355 18.6651C22.4732 17.7275 23 16.4556 23 15.1295C23 13.8034 22.4732 12.5316 21.5355 11.5939C20.5979 10.6563 19.3261 10.129 18 10.129V10Z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Satellite Icon
export const SatelliteIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M13 7L20 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 10L14 1L23 10L14 19L5 10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 17L2 24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 9L20 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 15L7 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="6" r="3" stroke={color} strokeWidth="2"/>
    </svg>
);
