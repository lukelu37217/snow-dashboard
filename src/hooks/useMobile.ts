/**
 * Mobile Detection Hook
 * 
 * Provides responsive breakpoint detection for mobile-first design.
 * Breakpoint: 768px (standard tablet/mobile threshold)
 */

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobile(): boolean {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
        };

        // Set initial value
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
}

export default useMobile;
