
import React from 'react';
import { SnowIcon, RefreshIcon, ClockIcon } from '../Icons/Icons';
import ProgressBar from './ProgressBar';

interface HeaderProps {
    lastUpdated: string;
    onRefresh: () => void;
    isLoading?: boolean;
    loadingProgress?: { current: number; total: number } | null;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, isLoading = false, loadingProgress = null }) => {
    return (
        <div style={{
            minHeight: '60px',
            backgroundColor: '#1e3a8a',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <SnowIcon size={28} color="white" />
                    <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>
                        Lawn 'N' Order | Snow Command
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Status Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <span style={{
                            height: '10px',
                            width: '10px',
                            backgroundColor: isLoading ? '#fbbf24' : '#22c55e',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: isLoading ? 'pulse 2s infinite' : 'none'
                        }}></span>
                        <span>{isLoading ? 'Loading...' : 'System Active'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                        <ClockIcon size={16} color="#cbd5e1" />
                        <span style={{ fontFamily: 'monospace' }}>{lastUpdated}</span>
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        style={{
                            backgroundColor: isLoading ? '#64748b' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshIcon size={16} color="white" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {loadingProgress && (
                <div style={{ paddingBottom: '12px' }}>
                    <ProgressBar
                        current={loadingProgress.current}
                        total={loadingProgress.total}
                        showText={true}
                    />
                </div>
            )}
        </div>
    );
};

export default Header;
