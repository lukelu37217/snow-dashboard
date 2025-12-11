
import { useState, useEffect } from 'react';
import './App.css';
import SnowMap from './components/Map/SnowMap';
import NeighborhoodDetail from './components/Weather/NeighborhoodDetail';
import GlobalForecastBar from './components/Weather/GlobalForecastBarApple';
import Header from './components/Dashboard/Header';
import AlertPanel from './components/Dashboard/AlertPanel';
import MetricsCards from './components/Dashboard/MetricsCards';

import { getCentroid } from './services/geoUtils';
import {
  fetchWeatherBatch,
  fetchCommunityWeather,
  clearWeatherCache,
  type WeatherData,
  type HybridWeatherResult
} from './services/weatherService';
import { type RealTimeObservation } from './services/weatherCanadaService';

// Simple guard to prevent overlapping refresh cycles
let isRefreshing = false;

function App() {
  const [geoData, setGeoData] = useState<any>(null);
  const [weatherMap, setWeatherMap] = useState<Map<string, WeatherData>>(new Map());

  // Winnipe City-Wide Hybrid Result
  const [cityWeather, setCityWeather] = useState<HybridWeatherResult | null>(null);

  const [selectedFeature, setSelectedFeature] = useState<any>(null);
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
      // 1. Load GeoJSON
      if (!geoData) {
        const response = await fetch('/winnipeg-neighbourhoods.geojson');
        const data = await response.json();
        setGeoData(data);
        const locations = data.features.map((f: any) => {
          const centroid = getCentroid(f.geometry);
          return { id: f.properties.id, lat: centroid?.lat || 0, lon: centroid?.lon || 0 };
        }).filter((l: any) => l.lat !== 0);

        const weatherResults = await fetchWeatherBatch(locations, forceRefresh);
        const map = new Map<string, WeatherData>();
        weatherResults.forEach(w => map.set(w.id, w));
        setWeatherMap(map);
      } else {
        const locations = geoData.features.map((f: any) => {
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
  };

  const handleAlertSelect = (id: string) => {
    if (!geoData) return;
    const feature = geoData.features.find((f: any) => f.properties.id === id);
    if (feature) setSelectedFeature(feature);
  };

  const getSelectedData = () => {
    if (!selectedFeature) return undefined;
    return weatherMap.get(selectedFeature.properties.id);
  }

  // Derive Urgent from "SnowRemoval" status
  const urgentCommunities = Array.from(weatherMap.entries())
    .filter(([_, data]) => data.snowRemoval?.needsRemoval)
    .map(([id, data]) => {
      const feat = geoData?.features.find((f: any) => f.properties.id === id);
      return { id, name: feat?.properties?.name || "Unknown", data };
    })
    .sort((a, b) => b.data.snowAccumulation24h - a.data.snowAccumulation24h);

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

          <AlertPanel
            urgentCommunities={urgentCommunities}
            onSelect={handleAlertSelect}
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
            borderRadius: '4px',
            border: '2px solid rgba(0,0,0,0.2)',
            cursor: 'pointer',
            padding: '5px 10px',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}
            onClick={() => setShowRadar(!showRadar)}
          >
            {showRadar ? '📡 Hide Radar' : '📡 Show Radar'}
          </div>

          <SnowMap
            geoJsonData={geoData}
            weatherData={weatherMap}
            onSelectNeighborhood={handleSelect}
            showRadar={showRadar}
          />

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
            <GlobalForecastBar 
              forecast={cityWeather?.forecast || null} 
              realtime={realTimeProp as RealTimeObservation | null}
            />
          </div>
        </div>

      </div>

      {selectedFeature && (
        <NeighborhoodDetail
          name={selectedFeature.properties.name}
          data={getSelectedData()}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
}

export default App;
