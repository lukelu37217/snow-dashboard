/**
 * MobileDriverMode Final (v6 - With Forecast)
 *
 * 完整的移动端设计,包含:
 * ✅ Header可展开预报条(24H/7D)
 * ✅ 属性详情Past 24h + Next 24h并列
 * ✅ 纯信息展示,无任务管理
 */

import React, { useState, useRef, useEffect } from 'react';
import type { WeatherData, DetailedForecast } from '../../services/weatherService';
import type { ClientProperty } from '../../config/clientProperties';
import type { ECForecastData } from '../../services/weatherCanadaService';
import { CLIENT_PROPERTIES } from '../../config/clientProperties';
import { getZoneStatus } from '../../utils/zoneStatusHelper';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';

// SVG Icons
const SnowflakeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const ChevronDownIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MapPinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CloseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChartIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const CloudIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const BellIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const BellOffIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 0 0-9.33-5" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const WindIcon: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </svg>
);

// 天气图标根据WMO代码
const getWeatherIcon = (code: number | undefined, size: number = 24, color: string = '#6b7280') => {
  if (!code) return <CloudIcon size={size} color={color} />;

  // Snow codes: 71-77, 85-86
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return <SnowflakeIcon size={size} color={color} />;
  }

  // Rain codes: 61-67, 80-82
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        <line x1="8" y1="19" x2="8" y2="21" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="16" y1="19" x2="16" y2="21" />
      </svg>
    );
  }

  // Clear/Partly cloudy: 0-3
  if (code <= 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
      </svg>
    );
  }

  return <CloudIcon size={size} color={color} />;
};

interface MobileDriverModeFinalProps {
  temperature: number | null;
  snowAccumulation: number;
  avgSnow?: number;
  isSnowing: boolean;
  lastUpdated: string;
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  onRefresh: () => void;
  selectedZoneId: string | null;
  onSelectZone: (feature: any) => void;
  selectedFeature: any;
  onClearSelection: () => void;
  forecast?: DetailedForecast | null;
  ecForecast?: ECForecastData | null;
  // Notification props
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
}

/**
 * 顶部状态栏 + 可展开预报条
 */
const TopBarWithForecast: React.FC<{
  temperature: number | null;
  maxSnow: number;
  isSnowing: boolean;
  onRefresh: () => void;
  forecast: DetailedForecast | null;
  ecForecast: ECForecastData | null;
  onHeightChange?: (height: number) => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
}> = ({ temperature, maxSnow, isSnowing, onRefresh, forecast, ecForecast, onHeightChange, notificationsEnabled = false, onToggleNotifications }) => {
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const [forecastMode, setForecastMode] = useState<'24h' | '7d'>('24h');

  // 通知父组件高度变化
  React.useEffect(() => {
    const height = forecastExpanded ? 180 : 56;
    onHeightChange?.( height);
  }, [forecastExpanded, onHeightChange]);

  const getStatusColor = () => {
    if (maxSnow >= 5) return '#ef4444';
    if (maxSnow >= 1) return '#f59e0b';
    return '#22c55e';
  };

  const getStatusText = () => {
    if (maxSnow >= 5) return 'Commercial Alert';
    if (maxSnow >= 1) return 'Residential Alert';
    return isSnowing ? 'Light Snow' : 'Clear';
  };

  // 准备24小时预报数据
  const hourlyData = React.useMemo(() => {
    if (!forecast?.hourly) return [];

    // fetchDetailedForecast不使用past_days参数,所以hourly data从当前时间开始
    // index 0 = 当前小时, index 1 = +1小时, 等等
    return Array.from({ length: 24 }, (_, i) => {
      if (i >= forecast.hourly.time.length) return null;

      const time = new Date(forecast.hourly.time[i]);
      return {
        hour: time.getHours(),
        temp: forecast.hourly.temperature_2m[i],
        snow: forecast.hourly.snowfall[i] || 0,
        weatherCode: forecast.hourly.weather_code?.[i]
      };
    }).filter(Boolean) as Array<{ hour: number; temp: number; snow: number; weatherCode?: number }>;
  }, [forecast]);

  // 准备7天预报数据
  const dailyData = React.useMemo(() => {
    if (!forecast?.daily) return [];

    return Array.from({ length: 7 }, (_, i) => {
      if (i >= forecast.daily.time.length) return null;

      const date = new Date(forecast.daily.time[i]);
      return {
        day: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
        tempMax: forecast.daily.temperature_2m_max[i],
        tempMin: forecast.daily.temperature_2m_min[i],
        snowSum: forecast.daily.snowfall_sum[i] || 0,
        weatherCode: forecast.daily.weather_code?.[i]
      };
    }).filter(Boolean) as Array<{ day: string; tempMax: number; tempMin: number; snowSum: number; weatherCode?: number }>;
  }, [forecast]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: forecastExpanded ? '180px' : '56px',
      backgroundColor: '#ffffff',
      zIndex: 2000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderBottom: `3px solid ${getStatusColor()}`,
      transition: 'height 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top, 0px)'
    }}>
      {/* 主状态栏 */}
      <div style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0
      }}>
        {/* 左侧: 温度 + 状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
            {temperature !== null ? `${temperature.toFixed(0)}°` : '--°'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: getStatusColor(),
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {getStatusText()}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              Max: {maxSnow.toFixed(1)}cm
            </span>
          </div>
        </div>

        {/* 右侧: 通知 + 预报按钮 + 刷新 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 通知按钮 */}
          {onToggleNotifications && (
            <button
              onClick={onToggleNotifications}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: notificationsEnabled ? '#dbeafe' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
              title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
              {notificationsEnabled 
                ? <BellIcon size={20} color="#3b82f6" />
                : <BellOffIcon size={20} color="#6b7280" />
              }
            </button>
          )}

          <button
            onClick={() => setForecastExpanded(!forecastExpanded)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: forecastExpanded ? '#dbeafe' : '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
          >
            <ChartIcon size={20} color={forecastExpanded ? '#3b82f6' : '#6b7280'} />
          </button>

          <button
            onClick={onRefresh}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* 预报条 - 展开时显示 */}
      {forecastExpanded && (
        <div style={{
          flex: 1,
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* 切换按钮 */}
          <div style={{
            display: 'flex',
            padding: '6px 16px',
            gap: '6px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0
          }}>
            <button
              onClick={() => setForecastMode('24h')}
              style={{
                flex: 1,
                padding: '5px 10px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: forecastMode === '24h' ? '#3b82f6' : 'transparent',
                color: forecastMode === '24h' ? '#ffffff' : '#6b7280',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
            >
              24 Hours
            </button>
            <button
              onClick={() => setForecastMode('7d')}
              style={{
                flex: 1,
                padding: '5px 10px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: forecastMode === '7d' ? '#3b82f6' : 'transparent',
                color: forecastMode === '7d' ? '#ffffff' : '#6b7280',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
            >
              7 Days
            </button>
          </div>

          {/* 预报内容 */}
          <div style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            padding: '10px 0',
            minHeight: '90px'
          }}>
            {forecastMode === '24h' ? (
              <div style={{
                display: 'flex',
                gap: '10px',
                padding: '0 16px',
                minWidth: 'max-content',
                height: '100%',
                alignItems: 'center'
              }}>
                {hourlyData.map((hour, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    minWidth: '48px'
                  }}>
                    <div style={{
                      fontSize: '0.65rem',
                      color: i === 0 ? '#3b82f6' : '#9ca3af',
                      fontWeight: i === 0 ? 600 : 400,
                      whiteSpace: 'nowrap'
                    }}>
                      {i === 0 ? 'Now' : `${hour.hour.toString().padStart(2, '0')}:00`}
                    </div>
                    {getWeatherIcon(hour.weatherCode, 18, '#6b7280')}
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                      {Math.round(hour.temp)}°
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: hour.snow > 0 ? '#3b82f6' : '#d1d5db',
                      fontWeight: hour.snow > 0 ? 600 : 400,
                      whiteSpace: 'nowrap'
                    }}>
                      {hour.snow > 0 ? `${hour.snow.toFixed(1)}` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                gap: '10px',
                padding: '0 16px',
                minWidth: 'max-content',
                height: '100%',
                alignItems: 'center'
              }}>
                {dailyData.map((day, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    minWidth: '52px'
                  }}>
                    <div style={{
                      fontSize: '0.7rem',
                      color: i === 0 ? '#3b82f6' : '#6b7280',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}>
                      {day.day}
                    </div>
                    {getWeatherIcon(day.weatherCode, 20, '#6b7280')}
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>
                      {Math.round(day.tempMax)}°
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      {Math.round(day.tempMin)}°
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: day.snowSum > 0 ? '#3b82f6' : '#d1d5db',
                      fontWeight: day.snowSum > 0 ? 600 : 400,
                      whiteSpace: 'nowrap'
                    }}>
                      {day.snowSum > 0 ? `${day.snowSum.toFixed(1)}` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 属性详情卡片 - Past 24h + Next 24h 并列
 */
const PropertyDetailCard: React.FC<{
  property: ClientProperty;
  weatherData: WeatherData | undefined;
  forecast: DetailedForecast | null;
  onClose: () => void;
}> = ({ property, weatherData, forecast, onClose }) => {
  const status = getZoneStatus(weatherData);

  // 计算Next 24h数据
  const next24h = React.useMemo(() => {
    if (!forecast?.hourly || !weatherData) return null;

    // fetchDetailedForecast不使用past_days参数,所以index 0就是当前小时
    // 我们直接从index 0开始计算未来24小时
    let totalSnow = 0;
    let maxSnowHour = 0;
    let hasSnow = false;

    const maxIndex = Math.min(24, forecast.hourly.snowfall.length);

    for (let i = 0; i < maxIndex; i++) {
      const snowfall = forecast.hourly.snowfall[i] || 0;
      totalSnow += snowfall;
      if (snowfall > maxSnowHour) maxSnowHour = snowfall;
      if (snowfall > 0.1) hasSnow = true;
    }

    // 计算降雪概率(简化: 如果有降雪则显示概率)
    const snowProbability = hasSnow ? Math.min(100, Math.round((totalSnow / 5) * 100)) : 0;

    // 获取主要天气代码 - 使用12小时后的天气代码
    const weatherCode = forecast.hourly.weather_code?.[Math.min(12, forecast.hourly.weather_code.length - 1)];

    return {
      totalSnow,
      probability: snowProbability,
      weatherCode,
      hasSnow
    };
  }, [forecast, weatherData]);

  const pastSnow = weatherData?.pastSnow24h || 0;

  return (
    <div style={{
      padding: '16px 20px',
      backgroundColor: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            {property.address}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {property.zone} · {property.type}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            flexShrink: 0,
            marginLeft: '12px'
          }}
        >
          <CloseIcon size={18} color="#6b7280" />
        </button>
      </div>

      {/* Past 24h + Next 24h 并列卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        {/* Past 24h */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}>
            Past 24 Hours
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: status.color
            }}>
              {pastSnow.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              cm
            </div>
            {getWeatherIcon(undefined, 28, status.color)}
          </div>

          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: `${status.color}15`,
            borderRadius: '6px'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: status.color,
              textAlign: 'center'
            }}>
              {status.label}
            </div>
          </div>
        </div>

        {/* Next 24h */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e0f2fe'
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px'
          }}>
            Next 24 Hours
          </div>

          {next24h ? (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: next24h.hasSnow ? '#3b82f6' : '#22c55e'
                }}>
                  {next24h.totalSnow.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  cm
                </div>
                {getWeatherIcon(next24h.weatherCode, 28, next24h.hasSnow ? '#3b82f6' : '#22c55e')}
              </div>

              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#eff6ff',
                borderRadius: '6px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#3b82f6',
                  textAlign: 'center'
                }}>
                  {next24h.probability}% Chance
                </div>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '120px',
              color: '#9ca3af',
              fontSize: '0.8rem'
            }}>
              No forecast data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 底部滑动面板
 */
const BottomSheet: React.FC<{
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  selectedFeature: any;
  onClearSelection: () => void;
  safeAreaBottom: number;
  forecast: DetailedForecast | null;
  headerHeight: number;
}> = ({ weatherData, geoJsonData, selectedPropertyId, onSelectProperty, selectedFeature, onClearSelection, safeAreaBottom, forecast, headerHeight }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedPropertyId || selectedFeature) {
      setExpanded(true);
    }
  }, [selectedPropertyId, selectedFeature]);

  const zoneGroups = React.useMemo(() => {
    const grouped = new Map<string, ClientProperty[]>();
    CLIENT_PROPERTIES.forEach(prop => {
      const existing = grouped.get(prop.zone) || [];
      existing.push(prop);
      grouped.set(prop.zone, existing);
    });

    const result: Array<{
      zoneName: string;
      properties: ClientProperty[];
      status: ReturnType<typeof getZoneStatus>;
      weatherData?: WeatherData;
    }> = [];

    grouped.forEach((properties, zoneName) => {
      const feature = geoJsonData?.features?.find((f: any) => f.properties.name === zoneName);
      const data = feature ? weatherData.get(feature.properties.id) : undefined;
      const status = getZoneStatus(data);
      result.push({ zoneName, properties, status, weatherData: data });
    });

    return result.sort((a, b) => b.status.level - a.status.level);
  }, [weatherData, geoJsonData]);

  const urgentCount = zoneGroups.filter(g => g.status.level >= 2).length;

  const toggleZone = (zoneName: string) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName);
      } else {
        newSet.add(zoneName);
      }
      return newSet;
    });
  };

  const collapsedHeight = 15;
  const expandedHeight = 75;
  const currentHeight = expanded ? expandedHeight : collapsedHeight;

  const selectedProperty = selectedPropertyId
    ? CLIENT_PROPERTIES.find(p => p.id === selectedPropertyId)
    : null;

  const selectedPropertyWeatherData = selectedProperty
    ? (() => {
        const zoneFeature = geoJsonData?.features?.find((f: any) => f.properties.name === selectedProperty.zone);
        return zoneFeature ? weatherData.get(zoneFeature.properties.id) : undefined;
      })()
    : undefined;

  return (
    <>
      {expanded && (
        <div
          onClick={() => {
            setExpanded(false);
            onClearSelection();
          }}
          style={{
            position: 'fixed',
            top: `${headerHeight}px`,
            left: 0,
            right: 0,
            bottom: `${currentHeight}vh`,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1400,
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${currentHeight}vh`,
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          zIndex: 1500,
          display: 'flex',
          flexDirection: 'column',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: `${safeAreaBottom}px`
        }}
      >
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '12px 20px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            cursor: 'pointer',
            touchAction: 'manipulation',
            borderBottom: expanded ? '1px solid #f3f4f6' : 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#d1d5db',
            borderRadius: '2px',
            margin: '0 auto 12px'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                {urgentCount > 0 ? `${urgentCount} Zones Need Service` : 'All Clear'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                {zoneGroups.length} zones · {CLIENT_PROPERTIES.length} properties
              </div>
            </div>
            <ChevronDownIcon
              size={24}
              color="#6b7280"
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            />
          </div>
        </div>

        {expanded && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            {selectedProperty && (
              <PropertyDetailCard
                property={selectedProperty}
                weatherData={selectedPropertyWeatherData}
                forecast={forecast}
                onClose={onClearSelection}
              />
            )}

            <div>
              {zoneGroups.map(group => {
                const isExpanded = expandedZones.has(group.zoneName);
                const hasSelectedProperty = group.properties.some(p => p.id === selectedPropertyId);

                return (
                  <div key={group.zoneName}>
                    <button
                      onClick={() => toggleZone(group.zoneName)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        backgroundColor: hasSelectedProperty ? '#f0f9ff' : '#ffffff',
                        border: 'none',
                        borderLeft: `4px solid ${group.status.color}`,
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          {group.zoneName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {group.properties.length} properties · {group.weatherData?.pastSnow24h?.toFixed(1) || '0.0'}cm
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                        {/* Drift Risk Warning */}
                        {group.weatherData?.driftRisk && (group.weatherData.driftRisk.level === 'high' || group.weatherData.driftRisk.level === 'moderate') && (
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: group.weatherData.driftRisk.level === 'high' ? '#fef2f2' : '#fffbeb',
                              color: group.weatherData.driftRisk.level === 'high' ? '#dc2626' : '#d97706',
                              fontSize: '0.65rem',
                              fontWeight: 600
                            }}
                          >
                            <WindIcon size={12} color={group.weatherData.driftRisk.level === 'high' ? '#dc2626' : '#d97706'} />
                            Drift
                          </div>
                        )}
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: group.status.color,
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {group.status.label}
                        </div>
                        <ChevronDownIcon
                          size={20}
                          color="#9ca3af"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ backgroundColor: '#f9fafb' }}>
                        {group.properties.map(property => (
                          <button
                            key={property.id}
                            onClick={() => onSelectProperty(property)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px 20px 14px 40px',
                              backgroundColor: property.id === selectedPropertyId ? '#e0f2fe' : 'transparent',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              textAlign: 'left',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            <MapPinIcon size={14} color={group.status.color} />
                            <span style={{
                              flex: 1,
                              fontSize: '0.9rem',
                              color: '#374151',
                              fontWeight: property.id === selectedPropertyId ? 600 : 400
                            }}>
                              {property.address}
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: '#9ca3af',
                              textTransform: 'uppercase'
                            }}>
                              {property.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/**
 * 主组件
 */
const MobileDriverModeFinal: React.FC<MobileDriverModeFinalProps> = (props) => {
  const deviceInfo = useDeviceInfo();
  const [headerHeight, setHeaderHeight] = useState(56);

  const allSnow = Array.from(props.weatherData.values()).map(d => d.pastSnow24h);
  const maxSnow = allSnow.length ? Math.max(...allSnow) : 0;

  return (
    <>
      <TopBarWithForecast
        temperature={props.temperature}
        maxSnow={maxSnow}
        isSnowing={props.isSnowing}
        onRefresh={props.onRefresh}
        forecast={props.forecast || null}
        ecForecast={props.ecForecast || null}
        onHeightChange={setHeaderHeight}
        notificationsEnabled={props.notificationsEnabled}
        onToggleNotifications={props.onToggleNotifications}
      />

      <BottomSheet
        weatherData={props.weatherData}
        geoJsonData={props.geoJsonData}
        selectedPropertyId={props.selectedPropertyId}
        onSelectProperty={props.onSelectProperty}
        selectedFeature={props.selectedFeature}
        onClearSelection={props.onClearSelection}
        safeAreaBottom={deviceInfo.safeAreaInsets.bottom}
        forecast={props.forecast || null}
        headerHeight={headerHeight}
      />
    </>
  );
};

export default MobileDriverModeFinal;
