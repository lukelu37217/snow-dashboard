
import React, { useState, useRef } from 'react';
import { 
  Snowflake, 
  Wind, 
  CloudSnow, 
  Sun, 
  Cloud 
} from 'phosphor-react';
import type { DetailedForecast } from '../../services/weatherService';

interface GlobalForecastBarProps {
    forecast: DetailedForecast | null;
}

const GlobalForecastBar: React.FC<GlobalForecastBarProps> = ({ forecast }) => {
    const [view, setView] = useState<'24h' | '7d'>('24h');

    if (!forecast) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading Winnipeg Metro Forecast...</div>
            </div>
        );
    }

    const { hourly, current, daily } = forecast;

    // 24H Data Preparation
    const currentHour = new Date().getHours();
    // If hourly.time starts at 00:00 today (index 0)
    const startIndex = currentHour;
    const hours = hourly.time.slice(startIndex, startIndex + 24);
    const temps = hourly.temperature_2m.slice(startIndex, startIndex + 24);
    const snows = hourly.snowfall.slice(startIndex, startIndex + 24);
    const winds = hourly.wind_gusts_10m ? hourly.wind_gusts_10m.slice(startIndex, startIndex + 24) : [];

    // 7D Data Preparation
    // daily.time has dates
    const days = daily.time;

    return (
        <div style={styles.container}>

            {/* LEFT: Current Conditions Panel */}
            <div style={styles.currentPanel}>
                <div style={styles.cityTitle}>WINNIPEG</div>
                <div style={styles.mainTemp}>{current.temperature_2m}°</div>
                <div style={styles.currentStats}>
                    <div>Wind: {current.wind_gusts_10m} km/h</div>
                    <div>Feels: {current.apparent_temperature}°</div>
                </div>
            </div>

            {/* RIGHT: Scrollable Timeline */}
            <div style={styles.scrollWrapper}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <span
                            style={{ ...styles.tab, fontWeight: view === '24h' ? 'bold' : 'normal', color: view === '24h' ? '#2563eb' : '#666' }}
                            onClick={() => setView('24h')}
                        >
                            24-Hour Forecast
                        </span>
                        <span
                            style={{ ...styles.tab, fontWeight: view === '7d' ? 'bold' : 'normal', color: view === '7d' ? '#2563eb' : '#666' }}
                            onClick={() => setView('7d')}
                        >
                            7-Day Trend
                        </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Scroll &rarr;</span>
                </div>

                <div style={{ ...styles.scrollContainer, position: 'relative' }}>
                    {view === '24h' && (
                        // Threshold Reference Lines
                        <>
                            {/* 5cm Commercial Trigger Line */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 65 + (5 * 30), // 65px base + 5cm * 30px scale
                                height: '2px',
                                backgroundColor: '#ef4444',
                                zIndex: 1,
                                pointerEvents: 'none'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '-18px',
                                    fontSize: '0.7rem',
                                    color: '#ef4444',
                                    fontWeight: 600,
                                    backgroundColor: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    border: '1px solid #ef4444'
                                }}>
                                    Commercial (5cm)
                                </span>
                            </div>
                            {/* 1cm Residential Trigger Line */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 65 + (1 * 30), // 65px base + 1cm * 30px scale
                                height: '1px',
                                borderTop: '2px dotted #f59e0b',
                                zIndex: 1,
                                pointerEvents: 'none'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '-18px',
                                    fontSize: '0.7rem',
                                    color: '#f59e0b',
                                    fontWeight: 600,
                                    backgroundColor: 'white',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    border: '1px solid #f59e0b'
                                }}>
                                    Residential (1cm)
                                </span>
                            </div>
                        </>
                    )}
                    {view === '24h' ? (
                        // 24 Hour View
                        hours.map((time, i) => {
                            const date = new Date(time);
                            const hourLabel = date.getHours() + ':00';
                            const temp = temps[i];
                            const snow = snows[i];
                            const wind = winds[i] || 0;

                            let icon = '☁️';
                            if (snow > 0.1) icon = '🌨️';
                            else if (snow > 0) icon = '❄️';
                            else if (temp > 20) icon = '☀️';

                            const barHeight = Math.min(snow * 30, 50);
                            const hasSnow = snow > 0;

                            return (
                                <div key={time} style={styles.hourCard}>
                                    <div style={styles.time}>{hourLabel}</div>
                                    <div style={styles.icon}>{icon}</div>
                                    <div style={styles.temp}>{temp}°</div>

                                    <div style={styles.snowBarContainer}>
                                        {hasSnow && (
                                            <div
                                                style={{
                                                    ...styles.snowBar,
                                                    height: `${Math.max(barHeight, 4)}px`,
                                                    opacity: snow > 0.5 ? 1 : 0.6
                                                }}
                                                title={`${snow} cm`}
                                            ></div>
                                        )}
                                    </div>
                                    <div style={styles.snowLabel}>{hasSnow ? `${snow}` : ''}</div>
                                    <div style={styles.wind}>{Math.round(wind)}</div>
                                </div>
                            );
                        })
                    ) : (
                        // 7 Day View
                        days.map((dateStr, i) => {
                            const date = new Date(dateStr + 'T00:00:00'); // Ensure local date parsing
                            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const max = daily.temperature_2m_max[i];
                            const min = daily.temperature_2m_min[i];
                            const snowSum = daily.snowfall_sum[i];

                            let icon = '☁️';
                            if (snowSum > 1) icon = '🌨️';
                            else if (snowSum > 0) icon = '❄️';
                            else if (max > 20) icon = '☀️';

                            const barHeight = Math.min(snowSum * 10, 50);

                            return (
                                <div key={dateStr} style={{ ...styles.hourCard, minWidth: '90px' }}>
                                    <div style={styles.time}>{dayLabel}</div>
                                    <div style={styles.icon}>{icon}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{max}°</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{min}°</div>

                                    <div style={{ ...styles.snowBarContainer, marginTop: '5px' }}>
                                        {snowSum > 0 && (
                                            <div
                                                style={{
                                                    ...styles.snowBar,
                                                    height: `${Math.max(barHeight, 4)}px`
                                                }}
                                            ></div>
                                        )}
                                    </div>
                                    <div style={styles.snowLabel}>{snowSum > 0 ? `${snowSum}cm` : ''}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        height: '180px',
        backgroundColor: 'white',
        borderTop: '1px solid #ddd',
        display: 'flex',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        width: '100%'
    },
    currentPanel: {
        width: '140px',
        minWidth: '140px',
        borderRight: '1px solid #eee',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb'
    },
    cityTitle: {
        fontWeight: 'bold',
        fontSize: '1rem',
        color: '#444',
        marginBottom: '5px'
    },
    mainTemp: {
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#222'
    },
    currentStats: {
        fontSize: '0.8rem',
        color: '#666',
        marginTop: '10px',
        textAlign: 'center'
    },
    scrollWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    header: {
        padding: '5px 15px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '35px',
        backgroundColor: '#fff'
    },
    tab: {
        cursor: 'pointer',
        fontSize: '0.9rem',
        userSelect: 'none'
    },
    loading: {
        padding: '20px',
        textAlign: 'center',
        color: '#666',
        width: '100%'
    },
    scrollContainer: {
        display: 'flex',
        overflowX: 'auto',
        height: '100%',
        padding: '10px',
        alignItems: 'flex-start'
    },
    hourCard: {
        minWidth: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderRight: '1px solid #f0f0f0',
        padding: '0 5px'
    },
    time: {
        fontSize: '0.8rem',
        fontWeight: 'bold',
        marginBottom: '5px'
    },
    icon: {
        fontSize: '1.2rem',
        marginBottom: '2px'
    },
    temp: {
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '5px'
    },
    snowBarContainer: {
        height: '50px',
        display: 'flex',
        alignItems: 'flex-end',
        width: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '2px',
        marginBottom: '2px'
    },
    snowBar: {
        width: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: '2px'
    },
    snowLabel: {
        fontSize: '0.7rem',
        color: '#3b82f6',
        height: '12px',
        marginBottom: '2px'
    },
    wind: {
        fontSize: '0.7rem',
        color: '#888',
        marginTop: 'auto'
    }
};

export default GlobalForecastBar;
