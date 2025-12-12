
import { useState, useEffect, useRef } from 'react';
import './App.css';
import SnowMap from './components/Map/SnowMap';
import NeighborhoodDetail from './components/Weather/NeighborhoodDetail';
import GlobalForecastBar from './components/Weather/GlobalForecastBarApple';
import Header from './components/Dashboard/Header';
import MetricsCards from './components/Dashboard/MetricsCards';
import PropertyList from './components/Dashboard/PropertyList';
import { LayersIcon } from './components/Icons/Icons';

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
import { type ClientProperty } from './config/clientProperties';

// Simple guard to prevent overlapping refresh cycles
let isRefreshing = false;

function App() {
  const [geoData, setGeoData] = useState<any>(null);           // ALL zones for map context
  const [serviceGeoData, setServiceGeoData] = useState<any>(null); // Only service zones for weather API
  const [weatherMap, setWeatherMap] = useState<Map<string, WeatherData>>(new Map());
  const mapRef = useRef<any>(null); // Reference to map for flyTo functionality

  // Winnipe City-Wide Hybrid Result
  const [cityWeather, setCityWeather] = useState<HybridWeatherResult | null>(null);
  
  // Weather Canada hourly forecast
  const [ecForecast, setEcForecast] = useState<ECForecastData | null>(null);

  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null); // Track selected zone for map highlighting
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null); // NEW: Track selected property
  const [showRadar, setShowRadar] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("--:--");

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
      // Also create filtered list for weather API calls (service zones only)
      if (!geoData) {
        const response = await fetch('/winnipeg-neighbourhoods.geojson');
        const fullData = await response.json();
        
        // Store ALL zones for map rendering (Focus Mode)
        setGeoData(fullData);
        
        // Filter to only service zones for API calls (reduces from ~240 to ~50 zones)
        const serviceZonesData = {
          ...fullData,
          features: fullData.features.filter((f: any) => isServiceZone(f.properties.name))
        };
        setServiceGeoData(serviceZonesData);
        
        console.log(`📍 Map zones: ${fullData.features.length} | Service zones: ${serviceZonesData.features.length}`);
        
        // Only fetch weather for SERVICE zones
        const locations = serviceZonesData.features.map((f: any) => {
          const centroid = getCentroid(f.geometry);
          return { id: f.properties.id, lat: centroid?.lat || 0, lon: centroid?.lon || 0 };
        }).filter((l: any) => l.lat !== 0);

        const weatherResults = await fetchWeatherBatch(locations, forceRefresh);
        const map = new Map<string, WeatherData>();
        weatherResults.forEach(w => map.set(w.id, w));
        setWeatherMap(map);
      } else {
        // Refresh: use existing serviceGeoData
        const locations = (serviceGeoData || geoData).features
          .filter((f: any) => isServiceZone(f.properties.name))
          .map((f: any) => {
            const centroid = getCentroid(f.geometry);
            return { id: f.properties.id, lat: centroid?.lat || 0, lon: centroid?.lon || 0 };
          }).filter((l: any) => l.lat !== 0);
        const weatherResults = await fetchWeatherBatch(locations, forceRefresh);
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
  };

  // Handler for clicking on sidebar items - flies to zone, highlights, and opens detail
  const handleAlertSelect = (id: string) => {
    if (!geoData) return;
    const feature = geoData.features.find((f: any) => f.properties.id === id);
    if (feature) {
      const data = weatherMap.get(id);
      const status = getZoneStatus(data);
      
      // Debug log for sidebar-map consistency
      console.log(`📋 Sidebar Click: "${feature.properties.name}" | ID: ${id} | Status: ${status.label} | Snow: ${status.snow24h.toFixed(1)}cm`);
      
      setSelectedFeature(feature);
      setSelectedZoneId(id); // Highlight on map
      setSelectedPropertyId(null); // Clear property selection
      
      // Fly to the zone on the map
      if (mapRef.current) {
        const centroid = getCentroid(feature.geometry);
        if (centroid) {
          mapRef.current.flyTo([centroid.lat, centroid.lon], 14, { duration: 1 });
        }
      }
    } else {
      console.warn(`⚠️ Zone ID "${id}" not found in geoData!`);
    }
  };

  // NEW: Handler for clicking on property addresses - flies to pin and highlights
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

  return (
    <div className="App" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <Header lastUpdated={lastUpdated} onRefresh={() => refreshData(true)} />

      <div style={{ flex: 1, display: 'flex', height: 'calc(100vh - 60px)' }}>

        <div style={{
          width: '35%',
          minWidth: '400px',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <MetricsCards
            realTime={cityWeather && cityWeather.current.source === 'observation' ? realTimeProp : null}
            forecastCurrent={cityWeather ? cityWeather.forecast.current : null}
            avgSnow24h={avgSnow}
            maxSnow24h={maxSnow}
          />

          {/* Property List - Shows addresses grouped by zone with click-to-zoom */}
          <PropertyList
            weatherData={weatherMap}
            geoJsonData={geoData}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handlePropertySelect}
          />

          <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
            System: Lawn 'N' Order Ops v2.0 (Hybrid Data)
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
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

          <SnowMap
            geoJsonData={geoData}
            weatherData={weatherMap}
            onSelectNeighborhood={handleSelect}
            showRadar={showRadar}
            mapRef={mapRef}
            selectedZoneId={selectedZoneId}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handlePropertySelect}
          />

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
            <GlobalForecastBar 
              forecast={cityWeather?.forecast || null} 
              realtime={realTimeProp as RealTimeObservation | null}
              ecForecast={ecForecast}
            />
          </div>
        </div>

      </div>

      {selectedFeature && (
        <NeighborhoodDetail
          name={selectedFeature.properties.name}
          data={getSelectedData()}
          forecast={cityWeather?.forecast || null}
          ecForecast={ecForecast}
          onClose={() => {
            setSelectedFeature(null);
            setSelectedZoneId(null); // Clear zone highlight
            setSelectedPropertyId(null); // Clear property highlight
          }}
        />
      )}
    </div>
  );
}

export default App;
