
import { useState, useEffect, useRef } from 'react';
import './App.css';
import SnowMap from './components/Map/SnowMap';
import NeighborhoodDetail from './components/Weather/NeighborhoodDetail';
import GlobalForecastBar from './components/Weather/GlobalForecastBarApple';
import Header from './components/Dashboard/Header';
import MetricsCards from './components/Dashboard/MetricsCards';
import PropertyList from './components/Dashboard/PropertyList';
import MobileDrawer from './components/Mobile/MobileDrawer';
import MobileBottomSheet from './components/Mobile/MobileBottomSheet';
import { LayersIcon, MenuIcon } from './components/Icons/Icons';
import useMobile from './hooks/useMobile';

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
  
  // Mobile-specific state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

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
    // Open bottom sheet on mobile
    if (isMobile) {
      setIsBottomSheetOpen(true);
    }
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
      
      // Fly to the zone on the map
      if (mapRef.current) {
        const centroid = getCentroid(feature.geometry);
        if (centroid) {
          mapRef.current.flyTo([centroid.lat, centroid.lon], 14, { duration: 1 });
        }
      }
      
      // Close sidebar and open bottom sheet on mobile
      if (isMobile) {
        setIsSidebarOpen(false);
        setIsBottomSheetOpen(true);
      }
    } else if (syntheticFeature) {
      // Handle synthetic bubble zone selection
      const data = weatherMap.get(id);
      const syntheticGeoJSON = {
        type: 'Feature',
        properties: { id: syntheticFeature.id, name: syntheticFeature.name, isSynthetic: true },
        geometry: syntheticFeature.geometry
      };
      
      setSelectedFeature(syntheticGeoJSON);
      setSelectedZoneId(id);
      
      if (mapRef.current) {
        mapRef.current.flyTo([syntheticFeature.lat, syntheticFeature.lng], 15, { duration: 1 });
      }
      
      if (isMobile) {
        setIsSidebarOpen(false);
        setIsBottomSheetOpen(true);
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
    
    // Fly to the property location
    if (mapRef.current) {
      mapRef.current.flyTo([property.lat, property.lng], 16, { duration: 1 });
    }
    
    // Close sidebar and open bottom sheet on mobile
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsBottomSheetOpen(true);
    }
  };

  // Close handlers
  const handleCloseDetail = () => {
    setSelectedFeature(null);
    setSelectedZoneId(null);
    setSelectedPropertyId(null);
    setIsBottomSheetOpen(false);
  };

  const getSelectedData = () => {
    if (!selectedFeature) return undefined;
    return weatherMap.get(selectedFeature.properties.id);
  }

  const allSnow = Array.from(weatherMap.values()).map(d => d.snowAccumulation24h);
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

  // Sidebar content component (shared between desktop and mobile drawer)
  const SidebarContent = () => (
    <>
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
        Snow Command v2.1 (Mobile Ready)
      </div>
    </>
  );

  // Combined GeoJSON with synthetic zones
  const combinedGeoData = geoData ? {
    ...geoData,
    features: [
      ...geoData.features,
      ...syntheticZonesToGeoJSON(syntheticZones)
    ]
  } : null;

  return (
    <div className="App" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header - Hidden on Mobile for full-screen map */}
      {!isMobile && <Header lastUpdated={lastUpdated} onRefresh={() => refreshData(true)} />}

      <div style={{ flex: 1, display: 'flex', height: isMobile ? '100vh' : 'calc(100vh - 60px)' }}>

        {/* Desktop Sidebar - Hidden on Mobile */}
        {!isMobile && (
          <div 
            className="desktop-only sidebar-desktop"
            style={{
              width: '35%',
              minWidth: '400px',
              backgroundColor: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <SidebarContent />
          </div>
        )}

        {/* Map Container - Full screen on mobile */}
        <div style={{ flex: 1, position: 'relative' }} className={isMobile ? 'mobile-map-container' : ''}>
          
          {/* Mobile Hamburger Menu Button */}
          {isMobile && (
            <button
              className="mobile-menu-btn mobile-only"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon size={24} color="#1e293b" />
            </button>
          )}
          
          {/* Radar Toggle Button */}
          {isMobile ? (
            <button
              className="mobile-radar-btn mobile-only"
              onClick={() => setShowRadar(!showRadar)}
              style={{ backgroundColor: showRadar ? '#dbeafe' : 'white' }}
              aria-label={showRadar ? 'Hide radar' : 'Show radar'}
            >
              <LayersIcon size={22} color={showRadar ? '#3b82f6' : '#64748b'} />
            </button>
          ) : (
            <div 
              className="desktop-only"
              style={{
                position: 'absolute',
                top: '20px',
                left: '60px',
                zIndex: 1000,
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '2px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                padding: '8px 14px',
                fontWeight: 600,
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
            </div>
          )}

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

          {/* Forecast Bar - Hidden on mobile */}
          {!isMobile && (
            <div className="desktop-only" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
              <GlobalForecastBar 
                forecast={cityWeather?.forecast || null} 
                realtime={realTimeProp as RealTimeObservation | null}
                ecForecast={ecForecast}
              />
            </div>
          )}
          
          {/* Mobile Last Updated Indicator */}
          {isMobile && (
            <div
              className="mobile-only"
              style={{
                position: 'absolute',
                bottom: 80,
                right: 16,
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                color: '#64748b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000
              }}
              onClick={() => refreshData(true)}
            >
              🔄 {lastUpdated}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobile && (
        <MobileDrawer isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
          <SidebarContent />
        </MobileDrawer>
      )}

      {/* Desktop Detail Panel */}
      {!isMobile && selectedFeature && (
        <NeighborhoodDetail
          name={selectedFeature.properties.name}
          data={getSelectedData()}
          forecast={cityWeather?.forecast || null}
          ecForecast={ecForecast}
          onClose={handleCloseDetail}
        />
      )}
      
      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <MobileBottomSheet 
          isOpen={isBottomSheetOpen} 
          onClose={handleCloseDetail}
          title={selectedFeature?.properties?.name || 'Zone Details'}
        >
          {selectedFeature ? (
            <MobileZoneDetail 
              name={selectedFeature.properties.name}
              data={getSelectedData()}
              isSynthetic={selectedFeature.properties?.isSynthetic}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
              Tap a zone on the map to see details
            </div>
          )}
        </MobileBottomSheet>
      )}
    </div>
  );
}

// Simplified mobile zone detail component
const MobileZoneDetail: React.FC<{
  name: string;
  data: WeatherData | undefined;
  isSynthetic?: boolean;
}> = ({ name, data, isSynthetic }) => {
  const status = getZoneStatus(data);
  
  return (
    <div>
      {/* Status Badge */}
      <div style={{
        display: 'inline-block',
        backgroundColor: status.color,
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '0.9rem',
        marginBottom: '16px'
      }}>
        {status.label} {isSynthetic && '(Bubble Zone)'}
      </div>
      
      {/* Snow Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '16px', 
          borderRadius: '12px',
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: status.color }}>
            {status.snow24h.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            cm next 24h
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '16px', 
          borderRadius: '12px',
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>
            {status.pastSnow24h.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            cm past 24h
          </div>
        </div>
      </div>
      
      {/* Temperature & Wind */}
      {data && (
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#f1f5f9',
          borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {data.temperature?.toFixed(0) || '--'}°C
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Temperature</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {data.windGusts?.toFixed(0) || '--'} km/h
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Wind Gusts</div>
          </div>
        </div>
      )}
      
      {/* Action needed indicator */}
      {status.needsAction && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: status.level === 3 ? '#fef2f2' : '#fffbeb',
          borderRadius: '12px',
          borderLeft: `4px solid ${status.color}`,
          fontSize: '0.85rem',
          fontWeight: 600,
          color: status.level === 3 ? '#b91c1c' : '#92400e'
        }}>
          ⚠️ {status.level === 3 ? 'Commercial clearing required' : 'Residential clearing required'}
        </div>
      )}
    </div>
  );
};

export default App;
