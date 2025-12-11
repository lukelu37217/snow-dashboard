/**
 * Apple-Style Global Forecast Bar
 * Features: Glassmorphism, Horizontal Scroll, Phosphor Icons, Smooth Animations
 * 
 * Data Sources:
 * - 24h forecast: Weather Canada City Page Weather API (primary)
 * - 7d forecast: Open-Meteo API (fallback, as Weather Canada only provides ~48h hourly)
 * - Real-time: Weather Canada SWOB API
 */

import React, { useState, useRef } from 'react';
import { 

  Wind, 
  CloudSnow, 
  Sun, 
  Cloud,
  CloudRain,
  CloudFog,
  Lightning,
  Moon,
  CloudMoon,
  Drop
} from 'phosphor-react';
import type { DetailedForecast } from '../../services/weatherService';
import type { RealTimeObservation, ECForecastData } from '../../services/weatherCanadaService';
import { ecIconToWmoCode } from '../../services/weatherCanadaService';

interface ForecastSelection {
  type: 'hour' | 'day';
  index: number;
  time: string;
  temp: number;
  snow: number;
  wind?: number;
}

interface GlobalForecastBarProps {
  forecast: DetailedForecast | null;
  realtime?: RealTimeObservation | null; // Real-time from Weather Canada
  ecForecast?: ECForecastData | null;    // Hourly forecast from Weather Canada
  onTimeSelect?: (selection: ForecastSelection) => void;
}

const GlobalForecastBar: React.FC<GlobalForecastBarProps> = ({ forecast, realtime, ecForecast, onTimeSelect }) => {
  const [view, setView] = useState<'24h' | '7d'>('24h');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!forecast) {
    return (
      <div style={styles.container}>
        <div style={styles.glassBackground} />
        <div style={styles.loading}>
          <CloudSnow size={24} weight="thin" style={{ opacity: 0.5 }} />
          <span style={{ marginLeft: '10px' }}>Loading forecast...</span>
        </div>
      </div>
    );
  }

  const { hourly, current, daily } = forecast;

  // 24H Data - Use Weather Canada if available, otherwise fallback to Open-Meteo
  const useWeatherCanada = ecForecast && ecForecast.hourlyForecasts.length >= 24;
  
  // Weather Canada hourly data (take first 24 hours)
  const ecHours = useWeatherCanada ? ecForecast.hourlyForecasts.slice(0, 24) : [];
  
  // Open-Meteo fallback data
  const currentHour = new Date().getHours();
  const startIndex = currentHour;
  const omHours = hourly.time.slice(startIndex, startIndex + 24);
  const omTemps = hourly.temperature_2m.slice(startIndex, startIndex + 24);
  const omSnows = hourly.snowfall.slice(startIndex, startIndex + 24);
  const omWinds = hourly.wind_gusts_10m ? hourly.wind_gusts_10m.slice(startIndex, startIndex + 24) : [];
  const omWeatherCodes = hourly.weather_code ? hourly.weather_code.slice(startIndex, startIndex + 24) : [];

  // 7D Data (always from Open-Meteo as Weather Canada doesn't provide daily summaries)
  const days = daily.time;
  const dailyWeatherCodes = daily.weather_code || [];

  // Check if it's currently night time (for moon icons)
  const isNightTime = (hour: number): boolean => hour < 6 || hour >= 20;

  /**
   * WMO Weather Code interpretation (International Standard)
   * Reference: https://open-meteo.com/en/docs
   * 
   * 0: Clear sky
   * 1, 2, 3: Mainly clear, partly cloudy, overcast
   * 45, 48: Fog
   * 51, 53, 55: Drizzle (light, moderate, dense)
   * 56, 57: Freezing drizzle
   * 61, 63, 65: Rain (slight, moderate, heavy)
   * 66, 67: Freezing rain
   * 71, 73, 75: Snow fall (slight, moderate, heavy)
   * 77: Snow grains
   * 80, 81, 82: Rain showers (slight, moderate, violent)
   * 85, 86: Snow showers (slight, heavy)
   * 95: Thunderstorm
   * 96, 99: Thunderstorm with hail
   */
  const getWeatherIconByCode = (code: number | undefined, hour: number, size: number = 32): React.ReactElement => {
    const isNight = isNightTime(hour);
    
    // Default fallback if no code
    if (code === undefined || code === null) {
      return isNight 
        ? <Moon size={size} weight="fill" color="#6366f1" />
        : <Sun size={size} weight="fill" color="#f59e0b" />;
    }

    // Clear sky
    if (code === 0) {
      return isNight
        ? <Moon size={size} weight="fill" color="#6366f1" />
        : <Sun size={size} weight="fill" color="#f59e0b" />;
    }
    
    // Mainly clear
    if (code === 1) {
      return isNight
        ? <Moon size={size} weight="thin" color="#818cf8" />
        : <Sun size={size} weight="thin" color="#fbbf24" />;
    }
    
    // Partly cloudy
    if (code === 2) {
      return isNight
        ? <CloudMoon size={size} weight="fill" color="#94a3b8" />
        : <Cloud size={size} weight="thin" color="#9ca3af" />;
    }
    
    // Overcast
    if (code === 3) {
      return <Cloud size={size} weight="fill" color="#6b7280" />;
    }
    
    // Fog
    if (code === 45 || code === 48) {
      return <CloudFog size={size} weight="fill" color="#9ca3af" />;
    }
    
    // Drizzle (light, moderate, dense)
    if (code >= 51 && code <= 55) {
      return <Drop size={size} weight="fill" color="#60a5fa" />;
    }
    
    // Freezing drizzle
    if (code === 56 || code === 57) {
      return <Drop size={size} weight="fill" color="#93c5fd" />;
    }
    
    // Rain (slight, moderate, heavy)
    if (code >= 61 && code <= 65) {
      const intensity = code === 65 ? 'fill' : code === 63 ? 'regular' : 'thin';
      return <CloudRain size={size} weight={intensity as any} color="#3b82f6" />;
    }
    
    // Freezing rain
    if (code === 66 || code === 67) {
      return <CloudRain size={size} weight="fill" color="#60a5fa" />;
    }
    
    // Snow fall (slight, moderate, heavy)
    if (code >= 71 && code <= 75) {
      if (code === 75) return <CloudSnow size={size} weight="fill" color="#3b82f6" />; // Heavy
      if (code === 73) return <CloudSnow size={size} weight="regular" color="#60a5fa" />; // Moderate
      return <CloudSnow size={size} weight="thin" color="#93c5fd" />; // Light
    }
    
    // Snow grains
    if (code === 77) {
      return <CloudSnow size={size} weight="duotone" color="#94a3b8" />;
    }
    
    // Rain showers
    if (code >= 80 && code <= 82) {
      const intensity = code === 82 ? 'fill' : code === 81 ? 'regular' : 'thin';
      return <CloudRain size={size} weight={intensity as any} color="#3b82f6" />;
    }
    
    // Snow showers
    if (code === 85 || code === 86) {
      return code === 86 
        ? <CloudSnow size={size} weight="fill" color="#3b82f6" />
        : <CloudSnow size={size} weight="regular" color="#60a5fa" />;
    }
    
    // Thunderstorm
    if (code >= 95) {
      return <Lightning size={size} weight="fill" color="#eab308" />;
    }
    
    // Fallback
    return <Cloud size={size} weight="thin" color="#9ca3af" />;
  };

  // Get weather description from WMO code
  const getWeatherDescription = (code: number | undefined): string => {
    if (code === undefined) return 'Unknown';
    if (code === 0) return 'Clear';
    if (code === 1) return 'Mostly Clear';
    if (code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Showers';
    if (code === 85 || code === 86) return 'Snow Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
  };

  // For daily view, use midday (12:00) as reference hour
  const getDailyWeatherIcon = (code: number | undefined, size: number = 32): React.ReactElement => {
    return getWeatherIconByCode(code, 12, size); // Use noon (daytime icon)
  };

  // Helper to format snow amount with Trace logic
  const formatSnowAmount = (snow: number): string => {
    if (snow >= 0.1) return `${snow.toFixed(1)}cm`;
    if (snow > 0) return 'Trace';
    return '0';
  };

  return (
    <div style={styles.container}>
      {/* Glassmorphism Background */}
      <div style={styles.glassBackground} />

      {/* LEFT: Current Panel */}
      <div style={styles.currentPanel}>
        <div style={styles.cityTitle}>WINNIPEG METRO</div>
        <div style={styles.mainTempContainer}>
          <span style={styles.mainTemp}>
            {Math.round(realtime?.temperature ?? current.temperature_2m)}
          </span>
          <span style={styles.degreeSymbol}>°</span>
        </div>
        {realtime && (
          <div style={styles.sourceLabel}>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
              🌡️ Live from YWG
            </span>
          </div>
        )}
        <div style={styles.currentStatsRow}>
          <div style={styles.statItem}>
            <Wind size={16} weight="thin" color="#64748b" />
            <span style={styles.statValue}>
              {Math.round(realtime?.windSpeed ?? current.wind_gusts_10m ?? 0)}
            </span>
            <span style={styles.statUnit}>km/h</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Feels</span>
            <span style={styles.statValue}>{Math.round(current.apparent_temperature || current.temperature_2m)}°</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Timeline */}
      <div style={styles.timelineWrapper}>
        {/* Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{ ...styles.tab, ...(view === '24h' ? styles.tabActive : {}) }}
            onClick={() => setView('24h')}
            title={useWeatherCanada ? 'Source: Environment Canada' : 'Source: Open-Meteo'}
          >
            24-Hour
            {useWeatherCanada && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#16a34a' }}>🍁</span>}
          </button>
          <button
            style={{ ...styles.tab, ...(view === '7d' ? styles.tabActive : {}) }}
            onClick={() => setView('7d')}
            title="Source: Open-Meteo"
          >
            7-Day
          </button>
        </div>

        {/* Scroll Area */}
        <div ref={scrollRef} style={styles.scrollContainer}>
          {view === '24h' && (
            <>
              {/* Hour Cards - Use Weather Canada data if available */}
              {useWeatherCanada ? (
                // Weather Canada Forecast
                ecHours.map((ecHour, i) => {
                  const date = new Date(ecHour.timestamp);
                  const hourLabel = date.getHours();
                  const temp = ecHour.temperature;
                  const wind = ecHour.windSpeed || 0;
                  const windGust = ecHour.windGust || wind;
                  const weatherCode = ecIconToWmoCode(ecHour.iconCode);
                  const precipChance = ecHour.precipChance;
                  const isNow = i === 0;
                  const isSelected = view === '24h' && selectedIndex === i;
                  const timeStr = hourLabel === 0 ? '12 AM' : hourLabel < 12 ? `${hourLabel} AM` : hourLabel === 12 ? '12 PM' : `${hourLabel - 12} PM`;
                  const weatherDesc = ecHour.condition;
                  const isSnowy = ecHour.condition.toLowerCase().includes('snow') || ecHour.condition.toLowerCase().includes('flurr');

                  const handleClick = () => {
                    setSelectedIndex(i);
                    onTimeSelect?.({
                      type: 'hour',
                      index: i,
                      time: timeStr,
                      temp,
                      snow: isSnowy && precipChance > 30 ? 0.5 : 0, // Estimate based on condition
                      wind: windGust
                    });
                  };

                  return (
                    <div
                      key={ecHour.timestamp}
                      onClick={handleClick}
                      style={{ 
                        ...styles.hourCard, 
                        ...(isNow ? styles.hourCardNow : {}),
                        ...(isSelected ? styles.hourCardSelected : {}),
                        cursor: 'pointer'
                      }}
                      title={`${timeStr}: ${weatherDesc}, ${Math.round(temp)}°C, ${precipChance}% precip, Wind ${Math.round(windGust)}km/h`}
                    >
                      <div style={styles.hourTime}>{timeStr}</div>
                      <div style={styles.hourIcon}>
                        {getWeatherIconByCode(weatherCode, hourLabel, 32)}
                      </div>
                      <div style={styles.hourTemp}>{Math.round(temp)}°</div>

                      {/* Precipitation Chance Bar (instead of snow bar) */}
                      <div style={styles.snowBarWrapper}>
                        {precipChance > 0 ? (
                          <div
                            style={{
                              ...styles.snowBar,
                              height: `${Math.max(precipChance * 0.6, 4)}px`,
                              background: isSnowy
                                ? 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)'
                                : 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)'
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '1px', backgroundColor: '#cbd5e1' }} />
                        )}
                      </div>

                      <div style={{
                        ...styles.snowAmount,
                        color: precipChance > 50 ? '#3b82f6' : '#94a3b8',
                        fontSize: '10px'
                      }}>
                        {precipChance > 0 ? `${precipChance}%` : '—'}
                      </div>

                      <div style={styles.windSpeed}>
                        <Wind size={12} weight="thin" color="#94a3b8" />
                        <span style={{ marginLeft: '2px' }}>{Math.round(windGust)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback: Open-Meteo Forecast
                omHours.map((time, i) => {
                  const date = new Date(time);
                  const hourLabel = date.getHours();
                  const temp = omTemps[i];
                  const snow = omSnows[i];
                  const wind = omWinds[i] || 0;
                  const weatherCode = omWeatherCodes[i];
                  const barHeight = Math.min(snow * 8, 60);
                  const isNow = i === 0;
                  const isSelected = view === '24h' && selectedIndex === i;
                  const timeStr = hourLabel === 0 ? '12 AM' : hourLabel < 12 ? `${hourLabel} AM` : hourLabel === 12 ? '12 PM' : `${hourLabel - 12} PM`;
                  const weatherDesc = getWeatherDescription(weatherCode);

                  const handleClick = () => {
                    setSelectedIndex(i);
                    onTimeSelect?.({
                      type: 'hour',
                      index: i,
                      time: timeStr,
                      temp,
                      snow,
                      wind
                    });
                  };

                  return (
                    <div
                      key={time}
                      onClick={handleClick}
                      style={{ 
                        ...styles.hourCard, 
                        ...(isNow ? styles.hourCardNow : {}),
                        ...(isSelected ? styles.hourCardSelected : {}),
                        cursor: 'pointer'
                      }}
                      title={`${timeStr}: ${weatherDesc}, ${Math.round(temp)}°C, ${snow > 0 ? snow.toFixed(1) + 'cm snow, ' : ''}Wind ${Math.round(wind)}km/h`}
                    >
                      <div style={styles.hourTime}>{timeStr}</div>
                      <div style={styles.hourIcon}>
                        {getWeatherIconByCode(weatherCode, hourLabel, 32)}
                      </div>
                      <div style={styles.hourTemp}>{Math.round(temp)}°</div>

                      <div style={styles.snowBarWrapper}>
                        {snow > 0 ? (
                          <div
                            style={{
                              ...styles.snowBar,
                              height: `${Math.max(barHeight, 4)}px`,
                              background: snow > 2 
                                ? 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)' 
                                : 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)'
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '1px', backgroundColor: '#cbd5e1' }} />
                        )}
                      </div>

                      <div style={{
                        ...styles.snowAmount,
                        color: snow > 0 && snow < 0.1 ? '#94a3b8' : '#3b82f6',
                        fontStyle: snow > 0 && snow < 0.1 ? 'italic' : 'normal'
                      }}>
                        {formatSnowAmount(snow)}
                      </div>

                      <div style={styles.windSpeed}>
                        <Wind size={12} weight="thin" color="#94a3b8" />
                        <span style={{ marginLeft: '2px' }}>{Math.round(wind)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {view === '7d' && (
            <>
              {days.map((dateStr, i) => {
                const date = new Date(dateStr + 'T00:00:00');
                const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const max = daily.temperature_2m_max[i];
                const min = daily.temperature_2m_min[i];
                const snowSum = daily.snowfall_sum[i];
                const weatherCode = dailyWeatherCodes[i];
                const barHeight = Math.min(snowSum * 6, 60);
                const isSelected = view === '7d' && selectedIndex === i;
                const weatherDesc = getWeatherDescription(weatherCode);

                const handleDayClick = () => {
                  setSelectedIndex(i);
                  onTimeSelect?.({
                    type: 'day',
                    index: i,
                    time: `${dayLabel} ${dateLabel}`,
                    temp: max,
                    snow: snowSum
                  });
                };

                return (
                  <div 
                    key={dateStr} 
                    onClick={handleDayClick}
                    style={{ 
                      ...styles.hourCard, 
                      minWidth: '85px',
                      ...(isSelected ? styles.hourCardSelected : {}),
                      cursor: 'pointer'
                    }}
                    title={`${dayLabel} ${dateLabel}: ${weatherDesc}, High ${Math.round(max)}°C, Low ${Math.round(min)}°C${snowSum > 0 ? ', ' + snowSum.toFixed(1) + 'cm snow' : ''}`}
                  >
                    <div style={styles.dayLabel}>{dayLabel}</div>
                    <div style={styles.hourIcon}>
                      {getDailyWeatherIcon(weatherCode, 32)}
                    </div>
                    <div style={styles.tempRange}>
                      <span style={styles.tempHigh}>{Math.round(max)}°</span>
                      <span style={styles.tempLow}>{Math.round(min)}°</span>
                    </div>

                    <div style={styles.snowBarWrapper}>
                      {snowSum > 0 ? (
                        <div
                          style={{
                            ...styles.snowBar,
                            height: `${Math.max(barHeight, 4)}px`,
                            background: snowSum > 2 
                              ? 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)' 
                              : 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 100%)'
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '1px', backgroundColor: '#cbd5e1' }} />
                      )}
                    </div>

                    <div style={{
                      ...styles.snowAmount,
                      color: snowSum > 0 && snowSum < 0.1 ? '#94a3b8' : '#3b82f6',
                      fontStyle: snowSum > 0 && snowSum < 0.1 ? 'italic' : 'normal'
                    }}>
                      {formatSnowAmount(snowSum)}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '230px',
    position: 'relative',
    display: 'flex',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    width: '100%',
    maxWidth: '100%'
  },
  glassBackground: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    borderTop: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.1)',
    zIndex: 0
  },
  currentPanel: {
    width: '180px',
    minWidth: '180px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    position: 'relative',
    zIndex: 1
  },
  cityTitle: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    color: '#64748b',
    marginBottom: '12px',
    textTransform: 'uppercase'
  },
  mainTempContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  mainTemp: {
    fontSize: '56px',
    fontWeight: 300,
    color: '#0f172a',
    lineHeight: 1,
    letterSpacing: '-2px'
  },
  degreeSymbol: {
    fontSize: '32px',
    fontWeight: 300,
    color: '#64748b',
    marginLeft: '4px',
    marginTop: '8px'
  },
  sourceLabel: {
    marginTop: '2px',
    marginBottom: '4px'
  },
  currentStatsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 500
  },
  statValue: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: 600
  },
  statUnit: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 400
  },
  statDivider: {
    width: '1px',
    height: '20px',
    background: 'rgba(0, 0, 0, 0.1)'
  },
  timelineWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
    minWidth: 0,
    overflow: 'hidden',
    width: '100%'
  },
  tabContainer: {
    display: 'flex',
    padding: '12px 20px',
    gap: '8px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
  },
  tab: {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  },
  tabActive: {
    color: '#0f172a',
    background: 'rgba(59, 130, 246, 0.1)',
    fontWeight: 600
  },
  scrollContainer: {
    flex: 1,
    display: 'flex',
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '20px',
    paddingRight: '80px',
    gap: '12px',
    position: 'relative',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    whiteSpace: 'nowrap',
    minWidth: 0,
    pointerEvents: 'auto',
    touchAction: 'pan-x',
    boxSizing: 'border-box'
  },
  thresholdLine: {
    position: 'absolute',
    left: '20px',
    right: '20px',
    height: '1px',
    pointerEvents: 'none',
    zIndex: 0
  },
  thresholdLabel: {
    position: 'absolute',
    right: '0',
    top: '-16px',
    fontSize: '10px',
    fontWeight: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '2px 8px',
    borderRadius: '4px',
    backdropFilter: 'blur(8px)'
  },
  hourCard: {
    minWidth: '70px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 8px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 1
  },
  hourCardNow: {
    // No special styling for "now" card - blend with others
  },
  hourCardSelected: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '2px solid rgba(16, 185, 129, 0.5)',
    boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
  },
  hourTime: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    whiteSpace: 'nowrap'
  },
  hourIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '32px'
  },
  hourTemp: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0f172a'
  },
  snowBarWrapper: {
    width: '20px',
    height: '60px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    background: 'rgba(226, 232, 240, 0.5)',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  snowBar: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '4px'
  },
  snowAmount: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#3b82f6'
  },
  windSpeed: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: 500,
    marginTop: 'auto'
  },
  dayLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569'
  },
  tempRange: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  tempHigh: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#0f172a'
  },
  tempLow: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#94a3b8'
  },
  loading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500,
    position: 'relative',
    zIndex: 1
  }
};

export default GlobalForecastBar;
