/**
 * MobileBottomSheet Component
 * 
 * Slide-up panel for zone details on mobile (Google Maps/Uber UX pattern).
 * Covers ~50% of screen when open, with easy-to-tap close button.
 */

import React from 'react';

interface MobileBottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({ isOpen, onClose, children, title }) => {
    return (
        <>
            {/* Backdrop - tapping closes sheet */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 1200,
                    opacity: isOpen ? 1 : 0,
                    visibility: isOpen ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                }}
            />

            {/* Bottom Sheet Panel */}
            <div
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    maxHeight: '60vh',
                    minHeight: '40vh',
                    backgroundColor: 'white',
                    borderTopLeftRadius: '20px',
                    borderTopRightRadius: '20px',
                    zIndex: 1250,
                    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Drag Handle */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '12px 0 8px 0',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'white',
                        borderTopLeftRadius: '20px',
                        borderTopRightRadius: '20px',
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            width: '40px',
                            height: '5px',
                            backgroundColor: '#cbd5e1',
                            borderRadius: '3px',
                        }}
                    />
                </div>

                {/* Header with Title and Close */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 20px 16px 20px',
                        borderBottom: '1px solid #e2e8f0',
                        position: 'sticky',
                        top: '32px',
                        backgroundColor: 'white',
                        zIndex: 10,
                    }}
                >
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                        {title || 'Zone Details'}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            borderRadius: '12px',
                            backgroundColor: '#f1f5f9',
                            cursor: 'pointer',
                            fontSize: '1.3rem',
                            color: '#64748b',
                            touchAction: 'manipulation',
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Sheet Content - Scrollable */}
                <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </>
    );
};

export default MobileBottomSheet;
