
import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import SnowMap from './components/Map/SnowMap';
import NeighborhoodDetail from './components/Weather/NeighborhoodDetail';
import GlobalForecastBar from './components/Weather/GlobalForecastBarApple';
import Header from './components/Dashboard/Header';
import MetricsCards from './components/Dashboard/MetricsCards';
import PropertyList from './components/Dashboard/PropertyList';
import AlertBanner from './components/Dashboard/AlertBanner';
import MobileDriverModeFinal from './components/Mobile/MobileDriverModeFinal';
import { LayersIcon, BellIcon, BellOffIcon } from './components/Icons/Icons';
import useMobile from './hooks/useMobile';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { flyToProperty } from './utils/mapHelpers';
import { notificationService, type SnowAlert } from './services/notificationService';

import { getCentroid } from './services/geoUtils';
import {
  fetchWeatherBatch,
  fetchCommunityWeather,
  clearWeatherCache,
  type WeatherData,
  type HybridWeatherResult
} from './services/weatherService';
import { 
  type RealTimeObservation, 
  type ECForecastData,
  getHourlyForecast 
} from './services/weatherCanadaService';
import { isServiceZone } from './config/serviceZones';
import { isInOperationalArea } from './config/westernSector';
import { type ClientProperty, CLIENT_PROPERTIES } from './config/clientProperties';
import { getZoneStatus } from './utils/zoneStatusHelper';
import { 
  generateSyntheticZones, 
  syntheticZonesToGeoJSON,
  type SyntheticZone 
} from './utils/syntheticZones';

// Simple guard to prevent overlapping refresh cycles
let isRefreshing = false;

function App() {
  const isMobile = useMobile(); // Mobile detection hook
  const deviceInfo = useDeviceInfo(); // Enhanced device info
  const [geoData, setGeoData] = useState<any>(null);           // ALL zones for map context
  const [serviceGeoData, setServiceGeoData] = useState<any>(null); // Only service zones for weather API
  const [syntheticZones, setSyntheticZones] = useState<SyntheticZone[]>([]); // Bubble zones for orphans
  const [weatherMap, setWeatherMap] = useState<Map<string, WeatherData>>(new Map());
  const mapRef = useRef<any>(null); // Reference to map for flyTo functionality

  // Winnipe City-Wide Hybrid Result
  const [cityWeather, setCityWeather] = useState<HybridWeatherResult | null>(null);
  
  // Weather Canada hourly forecast
  const [ecForecast, setEcForecast] = useState<ECForecastData | null>(null);

  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null); // Track selected zone for map highlighting
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null); // Track selected property
  const [showRadar, setShowRadar] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<SnowAlert[]>([]);

  // Initialize notification service
  useEffect(() => {
    notificationService.init().then(enabled => {
      setNotificationsEnabled(enabled);
    });

    // Subscribe to alerts
    const unsubscribe = notificationService.onAlert((alert) => {
      setActiveAlerts(prev => [...prev, alert]);
    });

    return () => unsubscribe();
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = useCallback(async () => {
    if (notificationsEnabled) {
      notificationService.setEnabled(false);
      setNotificationsEnabled(false);
    } else {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
    }
  }, [notificationsEnabled]);

  // Dismiss alert handler
  const handleDismissAlert = useCallback((alertId: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  // Dismiss all alerts
  const handleDismissAllAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  // Mobile-specific state - Driver Mode uses its own internal state

  const refreshData = async (forceRefresh = false) => {
    if (isRefreshing) return;
    isRefreshing = true;
    setLastUpdated("Updating...");
    
    // Clear cache if force refresh requested
    if (forceRefresh) {
      clearWeatherCache();
    }
    
    try {
      // 1. Load ALL GeoJSON zones (for map context/background)
      // Also create filtered list for weather API calls
      if (!geoData) {
        const response = await fetch('/winnipeg-neighbourhoods.geojson');
        const fullData = await response.json();
        
        // Store ALL zones for map rendering (Focus Mode)
        setGeoData(fullData);
        
        // Generate synthetic "bubble" zones for orphan addresses
        const bubbleZones = generateSyntheticZones(fullData.features);
        setSyntheticZones(bubbleZones);
        
        // Filter to service zones for the sidebar/metrics
        const serviceZonesData = {
          ...fullData,
          features: fullData.features.filter((f: any) => isServiceZone(f.properties.name))
        };
        setServiceGeoData(serviceZonesData);
        
        // WESTERN SECTOR: Fetch weather for ALL zones in operational area
        // This enables clicking on context zones to see their weather
        const westernSectorFeatures = fullData.features.filter((f: any) => 
          isServiceZone(f.properties.name) || isInOperationalArea(f)
        );
        
        console.log(`📍 Map zones: ${fullData.features.length} | Western Sector: ${westernSectorFeatures.length} | Bubble zones: ${bubbleZones.length}`);
        
        // HYBRID BATCH FETCHING: Western Sector zones + synthetic zone centroids
        const zoneLocations = westernSectorFeatures.map((f: any) => {
          const centroid = getCentroid(f.geometry);
          return { id: f.properties.id, lat: centroid?.lat || 0, lon: centroid?.lon || 0 };
        }).filter((l: any) => l.lat !== 0);
        
        // Add synthetic zone coordinates (orphan bubbles)
        const bubbleLocations = bubbleZones.map(zone => ({
          id: zone.id,
          lat: zone.lat,
          lon: zone.lng
        }));
        
        // Combine all locations for batch API call
        const allLocations = [...zoneLocations, ...bubbleLocations];
        console.log(`🌡️ Fetching weather for ${allLocations.length} locations (${zoneLocations.length} Western Sector zones + ${bubbleLocations.length} bubbles)`);

        const weatherResults = await fetchWeatherBatch(allLocations, forceRefresh);
        const map = new Map<string, WeatherData>();
        weatherResults.forEach(w => map.set(w.id, w));
        setWeatherMap(map);
      } else {
        // Refresh: use existing geoData and get Western Sector zones
        const westernSectorFeatures = geoData.features.filter((f: any) => 
          isServiceZone(f.properties.name) || isInOperationalArea(f)
        );
        
        const zoneLocations = westernSectorFeatures.map((f: any) => {
            const centroid = getCentroid(f.geometry);
            return { id: f.properties.id, lat: centroid?.lat || 0, lon: centroid?.lon || 0 };
          }).filter((l: any) => l.lat !== 0);
        
        // Include synthetic zones in refresh
        const bubbleLocations = syntheticZones.map(zone => ({
          id: zone.id,
          lat: zone.lat,
          lon: zone.lng
        }));
        
        const allLocations = [...zoneLocations, ...bubbleLocations];
        const weatherResults = await fetchWeatherBatch(allLocations, forceRefresh);
        const map = new Map<string, WeatherData>();
        weatherResults.forEach(w => map.set(w.id, w));
        setWeatherMap(map);
      }

      // 3. fetch Hybrid City Weather (Forecast + EC Observation)
      // Center of Winnipeg approx
      const hybrid = await fetchCommunityWeather(49.8951, -97.1384, forceRefresh);
      setCityWeather(hybrid);

      // 4. Fetch Weather Canada hourly forecast for the forecast bar
      const ecHourly = await getHourlyForecast();
      setEcForecast(ecHourly);

      setLastUpdated(new Date().toLocaleTimeString());

      // 5. Process notifications if enabled
      if (notificationsEnabled && weatherMap.size > 0) {
        // Build zone names map from geoData
        const zoneNames = new Map<string, string>();
        if (geoData) {
          geoData.features.forEach((f: any) => {
            zoneNames.set(f.properties.id, f.properties.name);
          });
        }
        // Add synthetic zone names
        syntheticZones.forEach(z => {
          zoneNames.set(z.id, z.name);
        });

        // Check for alerts
        await notificationService.processAlerts(weatherMap, zoneNames);
      }

    } catch (e) {
      console.error("Refresh failed", e);
      setLastUpdated("Error");
    } finally {
      isRefreshing = false;
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15 * 60 * 1000); // 15 min
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (feature: any) => {
    setSelectedFeature(feature);
    setSelectedZoneId(feature?.properties?.id || null);
  };

  // Handler for clicking on sidebar items - flies to zone, highlights, and opens detail
  const handleAlertSelect = (id: string) => {
    if (!geoData) return;
    const feature = geoData.features.find((f: any) => f.properties.id === id);
    
    // Also check synthetic zones
    const syntheticFeature = syntheticZones.find(z => z.id === id);
    
    if (feature) {
      const data = weatherMap.get(id);
      const status = getZoneStatus(data);
      
      console.log(`📋 Sidebar Click: "${feature.properties.name}" | ID: ${id} | Status: ${status.label} | Snow: ${status.snow24h.toFixed(1)}cm`);
      
      setSelectedFeature(feature);
      setSelectedZoneId(id);
      setSelectedPropertyId(null);
      
      // Fly to zone on map when clicked from sidebar
      if (mapRef.current && feature.geometry) {
        const centroid = getCentroid(feature.geometry);
        if (centroid) {
          mapRef.current.flyTo([centroid.lat, centroid.lon], 13, { duration: 0.5 });
        }
      }

    } else if (syntheticFeature) {
      // Handle synthetic bubble zone selection
      const syntheticGeoJSON = {
        type: 'Feature',
        properties: { id: syntheticFeature.id, name: syntheticFeature.name, isSynthetic: true },
        geometry: syntheticFeature.geometry
      };
      
      setSelectedFeature(syntheticGeoJSON);
      setSelectedZoneId(id);
      
      // Fly to synthetic zone
      if (mapRef.current) {
        mapRef.current.flyTo([syntheticFeature.lat, syntheticFeature.lng], 14, { duration: 0.5 });
      }
      
    } else {
      console.warn(`⚠️ Zone ID "${id}" not found in geoData or synthetic zones!`);
    }
  };

  // Handler for clicking on property addresses - flies to pin and highlights
  const handlePropertySelect = (property: ClientProperty) => {
    console.log(`🏠 Property Click: "${property.address}" | Zone: ${property.zone}`);

    setSelectedPropertyId(property.id);

    // Find the zone feature for this property
    const zoneFeature = geoData?.features.find((f: any) => f.properties.name === property.zone);
    if (zoneFeature) {
      setSelectedZoneId(zoneFeature.properties.id);
      setSelectedFeature(zoneFeature);
    }

    // Enhanced smooth fly animation to property
    if (mapRef.current && property.lat && property.lng) {
      flyToProperty(mapRef.current, property, {
        zoom: deviceInfo.isMobile ? 16 : 15,
        duration: 1.2 // Smoother animation
      });
    }
  };

  // Close handlers
  const handleCloseDetail = () => {
    setSelectedFeature(null);
    setSelectedZoneId(null);
    setSelectedPropertyId(null);
  };

  const getSelectedData = () => {
    if (!selectedFeature) return undefined;
    return weatherMap.get(selectedFeature.properties.id);
  }

  // Use PAST 24h snow for metrics (what has actually fallen - for dispatch decisions)
  const allSnow = Array.from(weatherMap.values()).map(d => d.pastSnow24h);
  const maxSnow = allSnow.length ? Math.max(...allSnow) : 0;
  const avgSnow = allSnow.length ? allSnow.reduce((a, b) => a + b, 0) / allSnow.length : 0;

  // Prepare Props for MetricsCards
  // We adapt Hybrid Weather result to the Props expected
  const realTimeProp = cityWeather && cityWeather.current.source === 'observation' ? {
    temperature: cityWeather.current.temperature,
    condition: cityWeather.current.condition,
    isSnowing: cityWeather.current.isSnowing,
    station: 'YWG (Hybrid)',
    humidity: 0,
    windSpeed: 0,
    observationTime: ''
  } : null;

  // Sidebar content - rendered inline to prevent PropertyList from remounting and losing expanded state

  // Combined GeoJSON with synthetic zones
  const combinedGeoData = geoData ? {
    ...geoData,
    features: [
      ...geoData.features,
      ...syntheticZonesToGeoJSON(syntheticZones)
    ]
  } : null;

  // Mobile Driver Mode Layout
  if (isMobile) {
    return (
      <div className="App" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Full-screen Map */}
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          paddingTop: '60px',  // Space for floating header
          paddingBottom: '20vh' // Space for bottom sheet - will be adjusted dynamically
        }}>
          {/* Radar Toggle - Top right */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            style={{
              position: 'absolute',
              top: '70px',
              right: '16px',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: showRadar ? '#dbeafe' : 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            aria-label={showRadar ? 'Hide radar' : 'Show radar'}
          >
            <LayersIcon size={22} color={showRadar ? '#3b82f6' : '#64748b'} />
          </button>
          
          <SnowMap
            geoJsonData={combinedGeoData}
            weatherData={weatherMap}
            onSelectNeighborhood={handleSelect}
            showRadar={showRadar}
            mapRef={mapRef}
            selectedZoneId={selectedZoneId}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handlePropertySelect}
            syntheticZones={syntheticZones}
            isMobile={true}
          />
        </div>
        
        {/* Driver Mode UI Overlay - Final Version with Forecast */}
        <MobileDriverModeFinal
          temperature={cityWeather?.current?.temperature ?? null}
          snowAccumulation={maxSnow}
          avgSnow={avgSnow}
          isSnowing={cityWeather?.current?.isSnowing || false}
          lastUpdated={lastUpdated}
          weatherData={weatherMap}
          geoJsonData={geoData}
          selectedPropertyId={selectedPropertyId}
          onSelectProperty={handlePropertySelect}
          onRefresh={() => refreshData(true)}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelect}
          selectedFeature={selectedFeature}
          onClearSelection={handleCloseDetail}
          forecast={cityWeather?.forecast || null}
          ecForecast={ecForecast}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleNotificationToggle}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="App" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <Header lastUpdated={lastUpdated} onRefresh={() => refreshData(true)} />

      {/* Alert Banner - Shows push notification alerts */}
      <AlertBanner
        alerts={activeAlerts}
        onDismiss={handleDismissAlert}
        onDismissAll={handleDismissAllAlerts}
      />

      <div style={{ flex: 1, display: 'flex', height: 'calc(100vh - 60px)' }}>

        {/* Desktop Sidebar */}
        <div 
          className="sidebar-desktop"
          style={{
            width: '35%',
            minWidth: '400px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <MetricsCards
            realTime={cityWeather && cityWeather.current.source === 'observation' ? realTimeProp : null}
            forecastCurrent={cityWeather ? cityWeather.forecast.current : null}
            avgSnow24h={avgSnow}
            maxSnow24h={maxSnow}
          />

          <PropertyList
            weatherData={weatherMap}
            geoJsonData={geoData}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handlePropertySelect}
          />

          <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
            Snow Command v2.2 (Driver Mode)
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Radar Toggle Button */}
          <button
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 1000,
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setShowRadar(!showRadar)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <LayersIcon size={18} color={showRadar ? '#3b82f6' : '#64748b'} />
            <span style={{ color: showRadar ? '#3b82f6' : '#1e293b' }}>
              {showRadar ? 'Hide Radar' : 'Show Radar'}
            </span>
          </button>

          {/* Notification Toggle Button */}
          <button
            style={{
              position: 'absolute',
              top: '16px',
              right: '160px',
              zIndex: 1000,
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            onClick={handleNotificationToggle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled
              ? <BellIcon size={18} color="#3b82f6" />
              : <BellOffIcon size={18} color="#64748b" />
            }
            <span style={{ color: notificationsEnabled ? '#3b82f6' : '#1e293b' }}>
              {notificationsEnabled ? 'Alerts On' : 'Alerts Off'}
            </span>
          </button>

          <SnowMap
            geoJsonData={combinedGeoData}
            weatherData={weatherMap}
            onSelectNeighborhood={handleSelect}
            showRadar={showRadar}
            mapRef={mapRef}
            selectedZoneId={selectedZoneId}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handlePropertySelect}
            syntheticZones={syntheticZones}
          />

          {/* Forecast Bar - Desktop only */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
            <GlobalForecastBar 
              forecast={cityWeather?.forecast || null} 
              realtime={realTimeProp as RealTimeObservation | null}
              ecForecast={ecForecast}
            />
          </div>
        </div>

      </div>

      {/* Desktop Detail Panel */}
      {selectedFeature && (
        <NeighborhoodDetail
          name={selectedFeature.properties.name}
          data={getSelectedData()}
          forecast={cityWeather?.forecast || null}
          ecForecast={ecForecast}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default App;

