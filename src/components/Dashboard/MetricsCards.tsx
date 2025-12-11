
import React from 'react';
import { SnowIcon, TemperatureIcon, LayersIcon } from '../Icons/Icons';
import type { RealTimeObservation } from '../../services/weatherCanadaService';
import type { DetailedForecast } from '../../services/weatherService';

interface MetricsCardsProps {
    realTime?: RealTimeObservation | null; // From Environment Canada
    forecastCurrent?: DetailedForecast['current'] | null; // From Open Meteo (Fallback)
    avgSnow24h: number;
    maxSnow24h: number;
}

const MetricsCards: React.FC<MetricsCardsProps> = ({ realTime, forecastCurrent, avgSnow24h, maxSnow24h }) => {

    // PRIORITY: Always use Weather Canada real-time observation data
    // Only fall back to forecast if unavailable
    const displayStatus = realTime
        ? {
            label: "CURRENT STATUS (LIVE)",
            value: realTime.isSnowing ? 'Snowing' : 'No Snow',
            detail: `${realTime.temperature}°C • ${realTime.condition}`,
            source: "Source: Environment Canada (Real-time)"
        }
        : forecastCurrent
            ? {
                label: "Current Status (Forecast)",
                value: (forecastCurrent.snowfall > 0 || (forecastCurrent.weather_code && [71, 73, 75, 77, 85, 86].includes(forecastCurrent.weather_code))) ? 'Expecting Snow' : 'No Snow (Model)',
                detail: `${forecastCurrent.temperature_2m}°C • Model Data`,
                source: "Source: Open-Meteo (Forecast)"
            }
            : {
                label: "Current Status",
                value: "Loading...",
                detail: "Fetching real-time data...",
                source: ""
            };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>

            {/* Real Time Status */}
            <div style={cardStyle}>
                <div style={labelStyle}>
                    <TemperatureIcon size={16} color="#64748b" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {displayStatus.label}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {realTime?.isSnowing || (forecastCurrent && forecastCurrent.snowfall > 0) ? (
                        <SnowIcon size={28} color="#3b82f6" />
                    ) : null}
                    {displayStatus.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
                    {displayStatus.detail}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
                    {displayStatus.source}
                </div>
            </div>

            {/* Max Accumulation */}
            <div style={cardStyle}>
                <div style={labelStyle}>
                    <LayersIcon size={16} color="#64748b" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Max Impact (24h)
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: maxSnow24h > 5 ? '#ef4444' : '#f59e0b', letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {maxSnow24h.toFixed(1)} <span style={{ fontSize: '1.2rem', fontWeight: 500, color: '#64748b' }}>cm</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px', fontWeight: 500 }}>
                    Avg: {avgSnow24h.toFixed(1)} cm
                </div>
            </div>

        </div>
    );
};

const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    padding: '20px',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    color: '#64748b',
    fontWeight: 600,
    marginBottom: '8px',
    letterSpacing: '0.05em'
};

export default MetricsCards;
