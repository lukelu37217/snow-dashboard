
import React from 'react';
import { AlertIcon, CheckIcon, SnowIcon, LocationIcon, WindIcon, TemperatureIcon } from '../Icons/Icons';
import type { WeatherData, DetailedForecast } from '../../services/weatherService';

interface AlertPanelProps {
    urgentCommunities: { id: string; name: string; data: WeatherData }[];
    onSelect: (id: string) => void;
    totalCommunities?: number;
    averageSnow24h?: number;
    cityForecast?: DetailedForecast | null;
}

const AlertPanel: React.FC<AlertPanelProps> = ({ urgentCommunities, onSelect, totalCommunities = 0, averageSnow24h = 0, cityForecast }) => {
    // Categorize by priority
    const highPriority = urgentCommunities.filter(c => c.data.snowRemoval?.priority === 'high');
    const mediumPriority = urgentCommunities.filter(c => c.data.snowRemoval?.priority === 'medium');

    // Calculate summary stats
    const totalUrgent = urgentCommunities.length;
    const maxSnow = urgentCommunities.length > 0
        ? Math.max(...urgentCommunities.map(c => c.data.snowAccumulation24h || 0))
        : 0;

    // City-Wide Snapshot calculations
    const calculateMaxWindGust = (): number => {
        if (!cityForecast?.hourly?.wind_gusts_10m) return 0;
        const next24h = cityForecast.hourly.wind_gusts_10m.slice(0, 24);
        return Math.max(...next24h);
    };

    const calculateMinWindChill = (): number => {
        if (!cityForecast?.hourly?.apparent_temperature) return 0;
        const next24h = cityForecast.hourly.apparent_temperature.slice(0, 24);
        return Math.min(...next24h);
    };

    const calculateNextSnow = (): string => {
        if (!cityForecast?.hourly?.snowfall || !cityForecast?.hourly?.time) return 'No data';
        
        const now = new Date();
        for (let i = 0; i < Math.min(cityForecast.hourly.snowfall.length, 48); i++) {
            if (cityForecast.hourly.snowfall[i] > 0.1) {
                const snowTime = new Date(cityForecast.hourly.time[i]);
                const diffHours = Math.round((snowTime.getTime() - now.getTime()) / (1000 * 60 * 60));
                
                if (diffHours <= 0) return 'Now';
                if (diffHours <= 24) return `In ${diffHours}h`;
                
                return snowTime.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
                       snowTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
        }
        return 'Clear 48h';
    };

    const maxWindGust = calculateMaxWindGust();
    const minWindChill = calculateMinWindChill();
    const nextSnow = calculateNextSnow();

    return (
        <div style={{
            backgroundColor: totalUrgent > 0 ? '#fef2f2' : '#f0fdf4',
            border: `2px solid ${totalUrgent > 0 ? '#ef4444' : '#10b981'}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: totalUrgent > 0 ? '#b91c1c' : '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {totalUrgent > 0 ? <AlertIcon size={20} color="#b91c1c" /> : <CheckIcon size={20} color="#059669" />}
                    {totalUrgent > 0 ? 'Urgent Action Required' : 'All Clear'}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {highPriority.length > 0 && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {highPriority.length} Commercial
                        </span>
                    )}
                    {mediumPriority.length > 0 && (
                        <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {mediumPriority.length} Residential
                        </span>
                    )}
                </div>
            </div>

            {/* Summary Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: urgentCommunities.length > 0 ? '12px' : '0',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase' }}>
                        Monitoring
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
                        {totalCommunities || urgentCommunities.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>zones</div>
                </div>
                <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(0,0,0,0.1)', borderRight: '1px solid rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase' }}>
                        Avg Snow 24h
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: averageSnow24h > 2 ? '#ef4444' : '#3b82f6' }}>
                        {averageSnow24h.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>cm</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase' }}>
                        Max Expected
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: maxSnow > 5 ? '#ef4444' : maxSnow > 2 ? '#f59e0b' : '#10b981' }}>
                        {maxSnow.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>cm</div>
                </div>
            </div>

            {urgentCommunities.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', margin: 0, padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '6px' }}>
                    <CheckIcon size={20} color="#059669" />
                    <span style={{ fontWeight: 500 }}>No critical zones at this time — conditions are favorable</span>
                </div>
            )}

            {/* City-Wide Snapshot - Fill Empty Space */}
            {urgentCommunities.length === 0 && cityForecast && (
                <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: '#6b7280',
                        marginBottom: '12px',
                        textTransform: 'uppercase'
                    }}>
                        City-Wide Snapshot (24h)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {/* Max Wind Gust */}
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            backgroundColor: maxWindGust > 50 ? '#fef2f2' : '#f8fafc',
                            borderRadius: '8px',
                            border: maxWindGust > 50 ? '1px solid #fecaca' : '1px solid #e2e8f0'
                        }}>
                            <div style={{ marginBottom: '6px' }}>
                                <WindIcon size={20} color={maxWindGust > 50 ? '#dc2626' : '#6b7280'} />
                            </div>
                            <div style={{
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                color: maxWindGust > 50 ? '#dc2626' : '#1f2937'
                            }}>
                                {Math.round(maxWindGust)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>km/h gust</div>
                        </div>

                        {/* Min Wind Chill */}
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ marginBottom: '6px' }}>
                                <TemperatureIcon size={20} color="#3b82f6" />
                            </div>
                            <div style={{
                                fontSize: '1.3rem',
                                fontWeight: 700,
                                color: minWindChill < -25 ? '#dc2626' : '#1f2937'
                            }}>
                                {Math.round(minWindChill)}°
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>wind chill</div>
                        </div>

                        {/* Next Snow */}
                        <div style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            backgroundColor: nextSnow === 'Now' ? '#eff6ff' : '#f8fafc',
                            borderRadius: '8px',
                            border: nextSnow === 'Now' ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                        }}>
                            <div style={{ marginBottom: '6px' }}>
                                <SnowIcon size={20} color={nextSnow === 'Now' ? '#3b82f6' : '#6b7280'} />
                            </div>
                            <div style={{
                                fontSize: nextSnow.length > 8 ? '0.9rem' : '1.1rem',
                                fontWeight: 700,
                                color: nextSnow === 'Now' ? '#2563eb' : nextSnow === 'Clear 48h' ? '#16a34a' : '#1f2937'
                            }}>
                                {nextSnow}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>next snow</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* High Priority First */}
                {highPriority.map(({ id, name, data }) => (
                    <div
                        key={id}
                        onClick={() => onSelect(id)}
                        style={{
                            backgroundColor: 'white',
                            borderLeft: '4px solid #ef4444',
                            padding: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <LocationIcon size={14} color="#ef4444" />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'white', backgroundColor: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    COMMERCIAL PLOW
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
                                <SnowIcon size={14} color="#6b7280" />
                                <span>
                                    {data.snowRemoval?.snowDepthCm.toFixed(1)}cm depth |
                                    {data.snowAccumulation24h.toFixed(1)}cm next 24h
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Medium Priority */}
                {mediumPriority.map(({ id, name, data }) => (
                    <div
                        key={id}
                        onClick={() => onSelect(id)}
                        style={{
                            backgroundColor: 'white',
                            borderLeft: '4px solid #f59e0b',
                            padding: '12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.15)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                            e.currentTarget.style.transform = 'translateX(0)';
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <LocationIcon size={14} color="#f59e0b" />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>{name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'white', backgroundColor: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                    RESIDENTIAL RUN
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#6b7280' }}>
                                <SnowIcon size={14} color="#6b7280" />
                                <span>
                                    {data.snowRemoval?.snowDepthCm.toFixed(1)}cm depth |
                                    {data.snowAccumulation24h.toFixed(1)}cm next 24h
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertPanel;
