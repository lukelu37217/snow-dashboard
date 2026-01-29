/**
 * Device Information Hook
 *
 * Provides detailed device information for responsive UX optimization:
 * - Screen size category (small/medium/large phone)
 * - Safe area insets (iOS notch/home indicator)
 * - Dynamic viewport height calculations
 */

import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  screenCategory: 'small' | 'medium' | 'large' | 'desktop';
  viewportHeight: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
  };
  // Dynamic sheet heights based on device
  sheetHeights: {
    collapsed: number; // vh
    list: number;      // vh
    detail: number;    // vh
  };
}

const MOBILE_BREAKPOINT = 768;
const SMALL_PHONE_HEIGHT = 700;   // iPhone SE, iPhone 8
const LARGE_PHONE_HEIGHT = 850;   // iPhone 14 Pro Max, Galaxy S23 Ultra

/**
 * Get CSS variable value for safe area insets
 */
const getSafeAreaInset = (position: 'top' | 'bottom'): number => {
  if (typeof window === 'undefined') return 0;

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`env(safe-area-inset-${position})`)
    .trim();

  return value ? parseInt(value) : 0;
};

/**
 * Calculate optimal sheet heights based on device
 */
const calculateSheetHeights = (vh: number, category: DeviceInfo['screenCategory']) => {
  switch (category) {
    case 'small':
      return {
        collapsed: 5,   // More map visible
        list: 40,       // Compact list
        detail: 85      // Full detail
      };
    case 'large':
      return {
        collapsed: 8,
        list: 55,       // More comfortable on large screens
        detail: 88
      };
    case 'medium':
    default:
      return {
        collapsed: 6,
        list: 50,
        detail: 87
      };
  }
};

export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        screenCategory: 'desktop',
        viewportHeight: 800,
        safeAreaInsets: { top: 0, bottom: 0 },
        sheetHeights: { collapsed: 8, list: 50, detail: 87 }
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width <= MOBILE_BREAKPOINT;

    let screenCategory: DeviceInfo['screenCategory'] = 'desktop';
    if (isMobile) {
      if (height < SMALL_PHONE_HEIGHT) {
        screenCategory = 'small';
      } else if (height > LARGE_PHONE_HEIGHT) {
        screenCategory = 'large';
      } else {
        screenCategory = 'medium';
      }
    }

    return {
      isMobile,
      screenCategory,
      viewportHeight: height,
      safeAreaInsets: {
        top: getSafeAreaInset('top'),
        bottom: getSafeAreaInset('bottom')
      },
      sheetHeights: calculateSheetHeights(height, screenCategory)
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width <= MOBILE_BREAKPOINT;

      let screenCategory: DeviceInfo['screenCategory'] = 'desktop';
      if (isMobile) {
        if (height < SMALL_PHONE_HEIGHT) {
          screenCategory = 'small';
        } else if (height > LARGE_PHONE_HEIGHT) {
          screenCategory = 'large';
        } else {
          screenCategory = 'medium';
        }
      }

      setDeviceInfo({
        isMobile,
        screenCategory,
        viewportHeight: height,
        safeAreaInsets: {
          top: getSafeAreaInset('top'),
          bottom: getSafeAreaInset('bottom')
        },
        sheetHeights: calculateSheetHeights(height, screenCategory)
      });
    };

    // Initial calculation
    handleResize();

    // Listen for resize and orientation change
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}

export default useDeviceInfo;
