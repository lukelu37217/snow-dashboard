/**
 * NeighborhoodDetail - Split View Sidebar
 * 
 * Section A (Top): THE GROUND REALITY (Past 24h) - Solid Data
 * Section B (Bottom): THE FORECAST (Future 24h) - Prediction
 * 
 * NO TABS - Both sections visible simultaneously for dispatch decisions
 * 
 * Data Sources:
 * - Open-Meteo: Precise hourly snowfall (cm) for charts and calculations
 * - Weather Canada (EC): Real-time conditions, alerts, general conditions
 */

import React from 'react';
import { CloseIcon, LocationIcon, SnowIcon, TemperatureIcon, WindIcon, AlertIcon, ClockIcon, StopwatchIcon } from '../Icons/Icons';
import type { WeatherData, DetailedForecast } from '../../services/weatherService';
import type { ECForecastData } from '../../services/weatherCanadaService';

interface NeighborhoodDetailProps {
    name: string;
    data: WeatherData | undefined;
    forecast?: DetailedForecast | null;
    ecForecast?: ECForecastData | null; // Weather Canada hourly forecast
    onClose: () => void;
}

const NeighborhoodDetail: React.FC<NeighborhoodDetailProps> = ({ name, data, forecast, ecForecast, onClose }) => {
    if (!name) return null;

    // Calculate future 24h snowfall from Open-Meteo forecast (precise cm data)
    const calculateFuture24hSnow = (): number => {
        if (!forecast?.hourly?.snowfall) return 0;
        const currentHour = new Date().getHours();
        const next24h = forecast.hourly.snowfall.slice(currentHour, currentHour + 24);
        return next24h.reduce((sum, val) => sum + (val || 0), 0);
    };

    // Calculate current snowfall rate from Open-Meteo (cm/h)
    const getCurrentSnowRate = (): number => {
        if (!forecast?.hourly?.snowfall) return 0;
        const currentHour = new Date().getHours();
        return forecast.hourly.snowfall[currentHour] || 0;
    };

    // Calculate "Snow Stop" time - HYBRID approach
    // Uses Weather Canada condition text if available, falls back to Open-Meteo snowfall data
    const calculateSnowStopTime = (): string => {
        const now = new Date();
        const currentHour = now.getHours();

        // Try Weather Canada hourly forecast first (more accurate conditions)
        if (ecForecast?.hourlyForecasts?.length) {
            let isCurrentlySnowing = false;
            
            for (let i = 0; i < Math.min(ecForecast.hourlyForecasts.length, 48); i++) {
                const hourData = ecForecast.hourlyForecasts[i];
                const condition = hourData.condition.toLowerCase();
                const isSnowCondition = condition.includes('snow') || 
                                        condition.includes('flurr') || 
                                        condition.includes('blizzard');
                const hasHighPrecipChance = hourData.precipChance > 30;
                
                if (isSnowCondition && hasHighPrecipChance) {
                    isCurrentlySnowing = true;
                }
                
                // Found the transition point: was snowing, now it's not
                if (isCurrentlySnowing && (!isSnowCondition || hourData.precipChance < 20)) {
                    const stopTime = new Date(hourData.timestamp);
                    const stopHour = stopTime.getHours();
                    const isToday = stopTime.getDate() === now.getDate();
                    const dayLabel = isToday ? 'Today' : 'Tomorrow';
                    return `${dayLabel} ${String(stopHour).padStart(2, '0')}:00`;
                }
            }
            
            if (isCurrentlySnowing) return "Ongoing (24h+)";
            
            // Check if any snow is expected
            const hasAnySnow = ecForecast.hourlyForecasts.some(h => 
                (h.condition.toLowerCase().includes('snow') || h.condition.toLowerCase().includes('flurr')) 
                && h.precipChance > 30
            );
            if (!hasAnySnow) return "Clear";
        }

        // Fallback to Open-Meteo snowfall data
        if (!forecast?.hourly?.snowfall) return "—";

        const hasAnySnow = forecast.hourly.snowfall.some(s => s > 0.01);
        if (!hasAnySnow) return "Clear";
        
        let isCurrentlySnowing = false;
        for (let i = 0; i < Math.min(forecast.hourly.snowfall.length, 48); i++) {
            if (forecast.hourly.snowfall[i] > 0.01) {
                isCurrentlySnowing = true;
            }
            if (isCurrentlySnowing && (forecast.hourly.snowfall[i] === 0 || forecast.hourly.snowfall[i] < 0.01)) {
                const stopHour = (currentHour + i) % 24;
                const isToday = i < (24 - currentHour);
                const dayLabel = isToday ? 'Today' : 'Tomorrow';
                return `${dayLabel} ${String(stopHour).padStart(2, '0')}:00`;
            }
        }

        if (!isCurrentlySnowing) return "Clear";
        return "Ongoing (24h+)";
    };

    // Get current condition text - prioritize forecast data for consistency
    const getCurrentCondition = (): string => {
        // First check if we have current snowfall from forecast (more reliable for demo)
        if (forecast?.current?.snowfall && forecast.current.snowfall > 0) {
            return "Snow";
        }
        // Then check weather code
        if (forecast?.current?.weather_code) {
            const code = forecast.current.weather_code;
            if (code >= 71 && code <= 77) return "Snow";
            if (code === 85 || code === 86) return "Snow Showers";
        }
        // Then try EC forecast
        if (ecForecast?.hourlyForecasts?.length) {
            return ecForecast.hourlyForecasts[0].condition;
        }
        // Fallback to data snowfall
        return data?.snowfall && data.snowfall > 0 ? "Snowing" : "Clear";
    };

    // Get threshold level description
    const getThresholdStatus = (snow24h: number): { level: string; color: string; bgColor: string; borderColor: string } => {
        if (snow24h >= 5.0) return { 
            level: 'COMMERCIAL TRIGGERED', 
            color: '#b91c1c', 
            bgColor: '#fee2e2', 
            borderColor: '#ef4444' 
        };
        if (snow24h >= 1.0) return { 
            level: 'RESIDENTIAL TRIGGERED', 
            color: '#92400e', 
            bgColor: '#fef3c7', 
            borderColor: '#f59e0b' 
        };
        if (snow24h >= 0.2) return { 
            level: 'SALTING / WATCH', 
            color: '#166534', 
            bgColor: '#dcfce7', 
            borderColor: '#22c55e' 
        };
        return { 
            level: 'CLEAR', 
            color: '#166534', 
            bgColor: '#dcfce7', 
            borderColor: '#22c55e' 
        };
    };

    const snow24h = data?.snowAccumulation24h || 0;
    // Use snow24h from map data as the authoritative source (it's already calculated correctly)
    const future24hSnow = snow24h; // This ensures consistency between Section A and Section B
    const snowStopTime = calculateSnowStopTime();
    const thresholdStatus = getThresholdStatus(snow24h);
    const currentSnowRate = getCurrentSnowRate();
    const currentCondition = getCurrentCondition();
    
    // Progress to 5cm threshold
    const progressTo5cm = Math.min((snow24h / 5) * 100, 100);

    return (
        <div style={{
            position: 'absolute',
            right: '20px',
            top: '20px',
            width: '400px',
            maxHeight: '90vh',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            border: '1px solid rgba(0,0,0,0.1)'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '2px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                borderRadius: '16px 16px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LocationIcon size={24} color="#ffffff" />
                    <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff', fontWeight: 600 }}>{name}</h2>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                    <CloseIcon size={20} color="#ffffff" />
                </button>
            </div>

            {!data && <p style={{ padding: '20px' }}>No data available.</p>}

            {data && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* SECTION A: THE GROUND REALITY (Past 24h) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#ffffff'
                    }}>
                        {/* Section Label */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                backgroundColor: '#1e3a8a',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '1px'
                            }}>
                                SECTION A
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#1e3a8a'
                            }}>
                                THE GROUND REALITY
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: '#64748b',
                                marginLeft: 'auto'
                            }}>
                                Past 24 Hours
                            </div>
                        </div>

                        {/* Big Number: Total Accumulated Snow */}
                        <div style={{
                            textAlign: 'center',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                fontSize: '4rem',
                                fontWeight: 800,
                                color: thresholdStatus.color,
                                lineHeight: 1,
                                letterSpacing: '-2px'
                            }}>
                                {snow24h.toFixed(1)}
                            </div>
                            <div style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: '#64748b'
                            }}>
                                cm accumulated
                            </div>
                        </div>

                        {/* Progress Bar to 5cm Threshold */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                                fontSize: '0.75rem',
                                color: '#64748b'
                            }}>
                                <span>Progress to Commercial (5cm)</span>
                                <span style={{ fontWeight: 600 }}>{progressTo5cm.toFixed(0)}%</span>
                            </div>
                            <div style={{
                                height: '12px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {/* 1cm marker */}
                                <div style={{
                                    position: 'absolute',
                                    left: '20%',
                                    top: 0,
                                    bottom: 0,
                                    width: '2px',
                                    backgroundColor: '#f59e0b',
                                    zIndex: 2
                                }} />
                                {/* Progress fill */}
                                <div style={{
                                    height: '100%',
                                    width: `${progressTo5cm}%`,
                                    background: snow24h >= 5 
                                        ? 'linear-gradient(90deg, #22c55e 0%, #f59e0b 20%, #ef4444 100%)'
                                        : snow24h >= 1
                                        ? 'linear-gradient(90deg, #22c55e 0%, #f59e0b 100%)'
                                        : '#22c55e',
                                    borderRadius: '6px',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '4px',
                                fontSize: '0.65rem',
                                color: '#94a3b8'
                            }}>
                                <span>0</span>
                                <span style={{ marginLeft: '15%' }}>1cm (Res.)</span>
                                <span>5cm (Com.)</span>
                            </div>
                        </div>

                        {/* Trigger Status Banner */}
                        <div style={{
                            padding: '14px',
                            borderRadius: '10px',
                            backgroundColor: thresholdStatus.bgColor,
                            border: `2px solid ${thresholdStatus.borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <AlertIcon size={28} color={thresholdStatus.borderColor} />
                            <div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    color: thresholdStatus.color
                                }}>
                                    {thresholdStatus.level}
                                </div>
                                {snow24h < 5 && snow24h >= 1 && (
                                    <div style={{ fontSize: '0.8rem', color: thresholdStatus.color, marginTop: '2px' }}>
                                        {(5 - snow24h).toFixed(1)}cm to Commercial trigger
                                    </div>
                                )}
                                {snow24h < 1 && (
                                    <div style={{ fontSize: '0.8rem', color: thresholdStatus.color, marginTop: '2px' }}>
                                        {(1 - snow24h).toFixed(1)}cm to Residential trigger
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Current Conditions Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '10px',
                            marginTop: '16px'
                        }}>
                            <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <TemperatureIcon size={18} color="#3b82f6" />
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                    {data.temperature.toFixed(0)}°C
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Temp</div>
                            </div>
                            <div style={{
                                backgroundColor: '#f8fafc',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <WindIcon size={18} color={data.windGusts > 40 ? '#ef4444' : '#22c55e'} />
                                <div style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: 700, 
                                    color: data.windGusts > 40 ? '#ef4444' : '#1e293b' 
                                }}>
                                    {data.windGusts.toFixed(0)}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                    {data.windGusts > 40 ? 'DRIFT RISK' : 'Wind km/h'}
                                </div>
                            </div>
                            <div style={{
                                backgroundColor: currentSnowRate > 0 ? '#ede9fe' : '#f8fafc',
                                padding: '10px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: currentSnowRate > 0.5 ? '2px solid #8b5cf6' : 'none'
                            }}>
                                <SnowIcon size={18} color={currentSnowRate > 0 ? '#8b5cf6' : '#94a3b8'} />
                                <div style={{ 
                                    fontSize: '1.1rem', 
                                    fontWeight: 700, 
                                    color: currentSnowRate > 0 ? '#7c3aed' : '#64748b' 
                                }}>
                                    {currentSnowRate.toFixed(1)}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                    {currentSnowRate > 0 ? 'cm/h now' : 'cm/h (Est.)'}
                                </div>
                            </div>
                        </div>
                        
                        {/* Current Condition from Weather Canada */}
                        {currentCondition && currentCondition !== 'Clear' && (
                            <div style={{
                                marginTop: '12px',
                                padding: '8px 12px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '1rem' }}>🍁</span>
                                <span>
                                    <strong>EC:</strong> {currentCondition}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* DIVIDER */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <div style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, #e5e7eb 0%, #cbd5e1 50%, #e5e7eb 100%)',
                        margin: '0 20px'
                    }} />

                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* SECTION B: THE FORECAST (Future 24h) */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#f8fafc'
                    }}>
                        {/* Section Label */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                backgroundColor: '#6366f1',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                letterSpacing: '1px'
                            }}>
                                SECTION B
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#6366f1'
                            }}>
                                THE FORECAST
                            </div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: '#64748b',
                                marginLeft: 'auto'
                            }}>
                                Next 24 Hours
                            </div>
                        </div>

                        {/* Key Forecast Metrics */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            {/* Expected Additional Snow */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '10px',
                                padding: '16px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: '#64748b',
                                    marginBottom: '6px',
                                    fontWeight: 500
                                }}>
                                    Expected Additional
                                </div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 800,
                                    color: future24hSnow > 2 ? '#ef4444' : future24hSnow > 0.5 ? '#f59e0b' : '#22c55e',
                                    lineHeight: 1
                                }}>
                                    +{future24hSnow.toFixed(1)}
                                </div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: '#94a3b8',
                                    fontWeight: 500
                                }}>
                                    cm incoming
                                </div>
                            </div>

                            {/* Snow Ends At */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '10px',
                                padding: '16px',
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: '#64748b',
                                    marginBottom: '6px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <StopwatchIcon size={14} color="#64748b" />
                                    Snow Ends At
                                </div>
                                <div style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 800,
                                    color: snowStopTime === 'Clear' ? '#22c55e' : '#1e3a8a',
                                    lineHeight: 1.2
                                }}>
                                    {snowStopTime}
                                </div>
                                {snowStopTime !== 'Clear' && snowStopTime !== '—' && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        marginTop: '4px'
                                    }}>
                                        {snowStopTime.includes('Ongoing') ? '⚠️ Extended event' : '✓ Window to dispatch'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Decision Helper */}
                        <div style={{
                            backgroundColor: '#eff6ff',
                            borderRadius: '8px',
                            padding: '12px',
                            border: '1px solid #bfdbfe'
                        }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#1e40af',
                                marginBottom: '6px'
                            }}>
                                💡 Decision Context
                            </div>
                            <div style={{
                                fontSize: '0.8rem',
                                color: '#1e3a8a',
                                lineHeight: 1.4
                            }}>
                                {(() => {
                                    const totalExpected = snow24h + future24hSnow;
                                    if (snow24h >= 5) {
                                        return "Commercial already triggered. Full deployment active.";
                                    }
                                    if (totalExpected >= 5) {
                                        return `Will hit Commercial threshold. Expected total: ${totalExpected.toFixed(1)}cm. Consider pre-positioning crews.`;
                                    }
                                    if (totalExpected >= 1) {
                                        return `Residential threshold ${snow24h >= 1 ? 'triggered' : 'will be hit'}. Expected total: ${totalExpected.toFixed(1)}cm.`;
                                    }
                                    if (future24hSnow > 0) {
                                        return `Light snow expected. Monitor conditions. May need salting.`;
                                    }
                                    return "Clear conditions expected. No immediate action needed.";
                                })()}
                            </div>
                        </div>

                        {/* Projected Total */}
                        {future24hSnow > 0 && (
                            <div style={{
                                marginTop: '12px',
                                padding: '10px',
                                backgroundColor: '#fef3c7',
                                borderRadius: '8px',
                                border: '1px solid #fcd34d',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 500 }}>
                                    Projected 24h Total:
                                </span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e' }}>
                                    {(snow24h + future24hSnow).toFixed(1)} cm
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default NeighborhoodDetail;
