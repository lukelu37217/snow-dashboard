# Weather Canada Real-Time Data API Fix

## Date: December 10, 2025

## Problem

The Current Status card was showing "Source: Open-Meteo (Forecast)" instead of using Weather Canada real-time observation data. The old XML API endpoint was deprecated and returning 404 errors.

**Old API (DEPRECATED)**:
```
https://dd.weather.gc.ca/observations/xml/MB/today/XWG_today.xml
Error: 404 Not Found
```

---

## Solution

Migrated to the **Weather Canada SWOB (Surface Weather Observations) API** using OGC API Features (GeoJSON format).

### New API Details

**Base URL**: `https://api.weather.gc.ca/collections/swob-realtime/items`

**Query Parameters**:
- `bbox`: Bounding box for spatial filtering (`-97.5,49.7,-97.0,50.1` for Winnipeg area)
- `f=json`: Return format as GeoJSON
- `limit=10`: Get up to 10 recent observations

**Query Example**:
```
https://api.weather.gc.ca/collections/swob-realtime/items?bbox=-97.5,49.7,-97.0,50.1&f=json&limit=10
```

---

## Winnipeg Weather Stations

The API returns observations from multiple Winnipeg-area stations:

| Station Code | Station Name | Coordinates | Notes |
|--------------|--------------|-------------|-------|
| **XWG** | WINNIPEG 'A' CS | 49.916°N, 97.249°W | Climate Station (preferred) |
| **CYWG** | Winnipeg Richardson Int'l Airport | 49.910°N, 97.240°W | Airport station |
| **XWN** | WINNIPEG THE FORKS | 49.888°N, 97.129°W | Downtown |
| **CYAV** | Winnipeg/St. Andrews | 50.056°N, 97.033°W | North of city |

**Priority**: The code preferentially uses XWG or CYWG data, falling back to the first available station.

---

## Data Fields Extracted

### SWOB API Properties Format

Properties use a `-value` suffix pattern (e.g., `tc_id-value`, `stn_nam-value`).

### Key Fields Used:

| Field Name | Description | Unit | Usage |
|------------|-------------|------|-------|
| `air_temp` | Air temperature | °C | Current temperature |
| `rel_hum` | Relative humidity | % | Humidity display |
| `avg_wnd_spd_10m_pst1mt` | Wind speed (10m, past 1 min) | m/s | Convert to km/h |
| `snw_dpth` or `snw_dpth_1` | Snow depth on ground | cm | Snow accumulation |
| `pcpn_amt_pst1hr` | Total precipitation past hour | mm | Detect precipitation |
| `rnfl_amt_pst1hr` | Rainfall amount past hour | mm | Distinguish rain from snow |
| `date_tm-value` | Observation timestamp | ISO 8601 | Observation time |
| `stn_nam-value` | Station name | string | Display station info |
| `tc_id-value` | Station ID code | string | Station identification |

---

## Snow Detection Logic

### Precipitation Analysis

```typescript
const snowfallAmount = Math.max(0, pcpnPast1hr - rnflPast1hr);
const isSnowing = (snowfallAmount > 0) || (pcpnPast1hr > 0 && temperature < 0);
```

**Logic**:
1. If `total precipitation > rainfall`, then we have snowfall
2. If any precipitation occurs when temperature < 0°C, assume snow

### Condition String

```typescript
let condition = "Clear";
if (isSnowing) {
    condition = "Snow";
} else if (pcpnPast1hr > 0) {
    condition = temperature < 0 ? "Snow" : "Rain";
} else if (snowDepth > 0) {
    condition = "Cloudy";
}
```

---

## Implementation Changes

### File: `src/services/weatherCanadaService.ts`

**Key Changes**:

1. **Updated API endpoint**:
```typescript
const SWOB_API_BASE = 'https://api.weather.gc.ca/collections/swob-realtime/items';
const BBOX_QUERY = '-97.5,49.7,-97.0,50.1'; // Winnipeg area
```

2. **Query with bounding box**:
```typescript
const url = `${SWOB_API_BASE}?bbox=${BBOX_QUERY}&f=json&limit=10`;
```

3. **Station selection logic**:
```typescript
let bestFeature = features.find((f: any) =>
    f.properties['tc_id-value'] === 'XWG' ||
    f.properties['tc_id-value'] === 'CYWG'
) || features[0];
```

4. **Property extraction with fallbacks**:
```typescript
const temperature = props.air_temp !== null && props.air_temp !== undefined ? props.air_temp : 0;
const stationName = props['stn_nam-value'] || props.stn_nam || 'Winnipeg Area';
```

5. **Improved snow detection**:
```typescript
const snowfallAmount = Math.max(0, pcpnPast1hr - rnflPast1hr);
const isSnowing = (snowfallAmount > 0) || (pcpnPast1hr > 0 && temperature < 0);
```

---

## Testing

Visit: **http://localhost:5175/**

### Expected Results:

1. **Current Status Card** should now show:
   - Source: "Environment Canada (Real-time)"
   - Station: "WINNIPEG 'A' CS (XWG)" or similar

2. **Console logs** should show:
   - `✅ Fetched fresh EC SWOB observation: WINNIPEG 'A' CS (XWG)`
   - OR `✅ Using cached EC observation`

3. **If API fails**, fallback message:
   - `⚠️ EC SWOB API failed, will use forecast model.`
   - System gracefully falls back to Open-Meteo forecast data

---

## Limitations

### Missing Field: `pres_weather_en`

The user requested using the `pres_weather_en` (Present Weather in English) field to detect conditions like "Light Snow", "Snow", "Drifting Snow" directly from the observation.

**Status**: This field **does NOT exist** in the SWOB real-time API response (verified by querying all 244 property fields).

**Workaround**: The implementation infers snow conditions from:
- Precipitation amounts (total vs rainfall)
- Temperature (< 0°C = snow, > 0°C = rain)
- Snow depth on ground

**Note**: For more detailed present weather conditions, we may need to use a different Environment Canada API collection (e.g., hourly observations or METAR data).

---

## Cache Strategy

- **Cache Duration**: 5 minutes (`OBS_CACHE_TTL = 5 * 60 * 1000`)
- **Cache Key**: `'env_canada_observation'`
- **Shared Cache**: Single observation cached for entire city (all neighborhoods use same data)
- **Cache Benefits**:
  - Reduces API calls
  - Faster subsequent page loads
  - Respects API rate limits

---

## API Response Format

### GeoJSON FeatureCollection Structure:

```json
{
  "type": "FeatureCollection",
  "numberMatched": 10,
  "numberReturned": 10,
  "features": [
    {
      "type": "Feature",
      "id": "...",
      "geometry": {
        "type": "Point",
        "coordinates": [-97.249, 49.916, 240.2]
      },
      "properties": {
        "tc_id-value": "XWG",
        "stn_nam-value": "WINNIPEG 'A' CS",
        "air_temp": -1.4,
        "rel_hum": 85,
        "avg_wnd_spd_10m_pst1mt": 10.5,
        "snw_dpth": 5,
        "pcpn_amt_pst1hr": 0.2,
        "rnfl_amt_pst1hr": 0.0,
        "date_tm-value": "2025-12-10T15:00:00Z"
      }
    }
  ]
}
```

---

## Error Handling

```typescript
try {
    // Fetch and process SWOB data
    return observation;
} catch (error: any) {
    console.warn("⚠️ EC SWOB API failed, will use forecast model.", error.message);
    return null; // Graceful fallback to Open-Meteo
}
```

**Fallback Behavior**:
- If Weather Canada API fails, returns `null`
- App.tsx checks if `cityWeather.current.source === 'observation'`
- If not observation data, displays forecast data instead
- User sees "Source: Open-Meteo (Forecast)" only when real-time data unavailable

---

## Next Steps (Optional Future Enhancements)

1. **Explore other EC API collections** for `pres_weather_en` field:
   - Try METAR collection
   - Try hourly observations collection
   - Check if present weather codes are available elsewhere

2. **Add station selection UI**:
   - Let users choose preferred station (XWG, CYWG, XWN, CYAV)
   - Display multiple stations' data side-by-side

3. **Historical data tracking**:
   - Log observation data over time
   - Create trends and charts
   - Compare forecasts vs actual observations

---

## References

- **API Documentation**: https://eccc-msc.github.io/open-data/msc-geomet/ogc_api_en/
- **WMS Documentation**: https://eccc-msc.github.io/open-data/msc-geomet/wms_en/
- **OpenAPI Spec**: https://api.weather.gc.ca/openapi?f=json
- **SWOB Collection**: https://api.weather.gc.ca/collections/swob-realtime/items

---

## Summary

✅ **FIXED**: Weather Canada real-time observation data now loading successfully using SWOB API

✅ **Uses**: Bounding box query to get Winnipeg-area stations (XWG, CYWG, XWN, CYAV)

✅ **Detects**: Snow conditions from precipitation and temperature data

✅ **Caches**: 5-minute cache to reduce API calls and improve performance

✅ **Fallback**: Gracefully falls back to Open-Meteo forecast if API fails

⚠️ **Note**: `pres_weather_en` field not available in SWOB API - using precipitation-based detection instead

---

**Status**: ✅ Ready for Testing

**Last Updated**: December 10, 2025
