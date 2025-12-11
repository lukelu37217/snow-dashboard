/**
 * Progress Bar Component
 * Shows loading progress with smooth animation
 */

import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
    current: number;
    total: number;
    showText?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, showText = true }) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="progress-bar-container">
            {showText && (
                <div className="progress-bar-text">
                    Loading: {current} / {total} ({percentage}%)
                </div>
            )}
            <div className="progress-bar-track">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
