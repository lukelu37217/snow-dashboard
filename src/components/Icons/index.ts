/**
 * Icons Barrel Export
 *
 * Central export point for all icons used in the application.
 * Import icons from this file for consistency.
 *
 * Usage:
 * import { SnowIcon, WeatherIcon, AlertIcon } from '@/components/Icons';
 */

// UI Icons (general purpose)
export {
  SnowIcon,
  AlertIcon,
  RefreshIcon,
  RadarIcon,
  DownloadIcon,
  ClockIcon,
  CalendarIcon,
  TemperatureIcon,
  WindIcon,
  LocationIcon,
  CheckIcon,
  CloseIcon,
  ChartIcon,
  InfoIcon,
  DropletIcon,
  LayersIcon,
  ClipboardIcon,
  StopwatchIcon,
  SpinnerIcon,
  MenuIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MapPinIcon,
  BlowingSnowIconUI,
  BellIcon,
  BellOffIcon,
  SettingsIcon,
  CloudIcon,
  SatelliteIcon,
} from './Icons';

// Weather condition icons
export {
  WeatherIcon,
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
  SnowWeatherIcon,
  HeavySnowIcon,
  BlowingSnowIcon,
  FreezingRainIcon,
  FreezingDrizzleIcon,
  ThunderstormIcon,
  RainSnowMixIcon,
  HazeIcon,
} from './WeatherIcons';

// Weather icon mapping utilities
export {
  type WeatherIconType,
  getIconTypeFromEC,
  getIconTypeFromWMO,
  isECNightIcon,
  isNightHour,
  ICON_TYPE_LABELS,
  EC_ICON_TO_TYPE,
  WMO_CODE_TO_TYPE,
} from './weatherIconMap';

// Icon props type for consistent interface
export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}
