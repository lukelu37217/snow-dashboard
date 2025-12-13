/**
 * MobileDrawer Component
 * 
 * Slide-in drawer for mobile sidebar navigation.
 * Hamburger menu triggers drawer from left side.
 */

import React from 'react';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, children }) => {
    return (
        <>
            {/* Backdrop Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1050,
                    opacity: isOpen ? 1 : 0,
                    visibility: isOpen ? 'visible' : 'hidden',
                    transition: 'opacity 0.3s ease, visibility 0.3s ease',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Drawer Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '85%',
                    maxWidth: '360px',
                    backgroundColor: '#f8fafc',
                    zIndex: 1100,
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.3)' : 'none',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Drawer Header with Close Button */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                        ❄️ Snow Command
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            borderRadius: '12px',
                            backgroundColor: '#f1f5f9',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            color: '#64748b',
                            touchAction: 'manipulation',
                        }}
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>

                {/* Drawer Content */}
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </>
    );
};

export default MobileDrawer;
