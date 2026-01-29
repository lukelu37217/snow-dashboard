/**
 * MobileDriverMode Simple (v5 - Clean Info Display)
 *
 * 简洁的移动端设计,专注于信息展示:
 * ✅ 清晰的降雪信息展示
 * ✅ 简单的滑动交互
 * ✅ 灵活的详细信息展开/收起
 * ✅ 无任务管理,纯信息参考
 */

import React, { useState, useRef, useEffect } from 'react';
import type { WeatherData, DetailedForecast } from '../../services/weatherService';
import type { ClientProperty } from '../../config/clientProperties';
import type { ECForecastData } from '../../services/weatherCanadaService';
import { CLIENT_PROPERTIES } from '../../config/clientProperties';
import { getZoneStatus } from '../../utils/zoneStatusHelper';
import { useDeviceInfo } from '../../hooks/useDeviceInfo';

// SVG Icons
const SnowflakeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const ChevronDownIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MapPinIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CloseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface MobileDriverModeSimpleProps {
  temperature: number | null;
  snowAccumulation: number;
  avgSnow?: number;
  isSnowing: boolean;
  lastUpdated: string;
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  onRefresh: () => void;
  selectedZoneId: string | null;
  onSelectZone: (feature: any) => void;
  selectedFeature: any;
  onClearSelection: () => void;
  forecast?: DetailedForecast | null;
  ecForecast?: ECForecastData | null;
}

/**
 * 顶部状态栏 - 简洁版
 */
const TopBar: React.FC<{
  temperature: number | null;
  maxSnow: number;
  isSnowing: boolean;
  onRefresh: () => void;
}> = ({ temperature, maxSnow, isSnowing, onRefresh }) => {
  const getStatusColor = () => {
    if (maxSnow >= 5) return '#ef4444'; // 红色 - 商业
    if (maxSnow >= 1) return '#f59e0b'; // 橙色 - 住宅
    return '#22c55e'; // 绿色 - 清晰
  };

  const getStatusText = () => {
    if (maxSnow >= 5) return 'Commercial Alert';
    if (maxSnow >= 1) return 'Residential Alert';
    return isSnowing ? 'Light Snow' : 'Clear';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 2000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderBottom: `3px solid ${getStatusColor()}`
    }}>
      {/* 左侧: 温度 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827' }}>
          {temperature !== null ? `${temperature.toFixed(0)}°` : '--°'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: getStatusColor(),
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {getStatusText()}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
            Max: {maxSnow.toFixed(1)}cm
          </span>
        </div>
      </div>

      {/* 右侧: 刷新按钮 */}
      <button
        onClick={onRefresh}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          touchAction: 'manipulation'
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
    </div>
  );
};

/**
 * 底部滑动面板 - 简化版
 */
const BottomSheet: React.FC<{
  weatherData: Map<string, WeatherData>;
  geoJsonData: any;
  selectedPropertyId: string | null;
  onSelectProperty: (property: ClientProperty) => void;
  selectedFeature: any;
  onClearSelection: () => void;
  safeAreaBottom: number;
}> = ({ weatherData, geoJsonData, selectedPropertyId, onSelectProperty, selectedFeature, onClearSelection, safeAreaBottom }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  // 选中属性或区域时自动展开
  useEffect(() => {
    if (selectedPropertyId || selectedFeature) {
      setExpanded(true);
    }
  }, [selectedPropertyId, selectedFeature]);

  // 按区域分组属性
  const zoneGroups = React.useMemo(() => {
    const grouped = new Map<string, ClientProperty[]>();
    CLIENT_PROPERTIES.forEach(prop => {
      const existing = grouped.get(prop.zone) || [];
      existing.push(prop);
      grouped.set(prop.zone, existing);
    });

    const result: Array<{
      zoneName: string;
      properties: ClientProperty[];
      status: ReturnType<typeof getZoneStatus>;
      weatherData?: WeatherData;
    }> = [];

    grouped.forEach((properties, zoneName) => {
      const feature = geoJsonData?.features?.find((f: any) => f.properties.name === zoneName);
      const data = feature ? weatherData.get(feature.properties.id) : undefined;
      const status = getZoneStatus(data);
      result.push({ zoneName, properties, status, weatherData: data });
    });

    // 按状态级别排序
    return result.sort((a, b) => b.status.level - a.status.level);
  }, [weatherData, geoJsonData]);

  const urgentCount = zoneGroups.filter(g => g.status.level >= 2).length;

  const toggleZone = (zoneName: string) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName);
      } else {
        newSet.add(zoneName);
      }
      return newSet;
    });
  };

  // 高度计算
  const collapsedHeight = 15; // vh
  const expandedHeight = 75; // vh
  const currentHeight = expanded ? expandedHeight : collapsedHeight;

  return (
    <>
      {/* 背景遮罩 - 展开时显示 */}
      {expanded && (
        <div
          onClick={() => {
            setExpanded(false);
            onClearSelection();
          }}
          style={{
            position: 'fixed',
            top: 56,
            left: 0,
            right: 0,
            bottom: `${currentHeight}vh`,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1400,
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* 底部面板 */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${currentHeight}vh`,
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
          zIndex: 1500,
          display: 'flex',
          flexDirection: 'column',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: `${safeAreaBottom}px`
        }}
      >
        {/* 拖动手柄和头部 */}
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            padding: '12px 20px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            cursor: 'pointer',
            touchAction: 'manipulation',
            borderBottom: expanded ? '1px solid #f3f4f6' : 'none'
          }}
        >
          {/* 拖动条 */}
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#d1d5db',
            borderRadius: '2px',
            margin: '0 auto 12px'
          }} />

          {/* 头部信息 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                {urgentCount > 0 ? `${urgentCount} Zones Need Service` : 'All Clear'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                {zoneGroups.length} zones · {CLIENT_PROPERTIES.length} properties
              </div>
            </div>
            <ChevronDownIcon
              size={24}
              color="#6b7280"
              style={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            />
          </div>
        </div>

        {/* 内容区域 - 可滚动 */}
        {expanded && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* 选中属性的详细信息 */}
            {selectedPropertyId && (() => {
              const property = CLIENT_PROPERTIES.find(p => p.id === selectedPropertyId);
              if (!property) return null;

              const zoneFeature = geoJsonData?.features?.find((f: any) => f.properties.name === property.zone);
              const data = zoneFeature ? weatherData.get(zoneFeature.properties.id) : undefined;
              const status = getZoneStatus(data);

              return (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                        {property.address}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {property.zone} · {property.type}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSelection();
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <CloseIcon size={18} color="#6b7280" />
                    </button>
                  </div>

                  {/* 降雪信息卡片 */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          Past 24 Hours
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: status.color }}>
                          {data?.pastSnow24h?.toFixed(1) || '0.0'} cm
                        </div>
                      </div>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: `${status.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <SnowflakeIcon size={28} color={status.color} />
                      </div>
                    </div>

                    {/* 状态标签 */}
                    <div style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      backgroundColor: `${status.color}15`,
                      borderRadius: '8px',
                      borderLeft: `3px solid ${status.color}`
                    }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: status.color }}>
                        {status.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                        {status.needsAction
                          ? `Exceeds ${status.level === 3 ? '5cm' : '1cm'} threshold`
                          : 'No action needed'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 区域列表 */}
            <div>
              {zoneGroups.map(group => {
                const isExpanded = expandedZones.has(group.zoneName);
                const hasSelectedProperty = group.properties.some(p => p.id === selectedPropertyId);

                return (
                  <div key={group.zoneName}>
                    {/* 区域头部 */}
                    <button
                      onClick={() => toggleZone(group.zoneName)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        backgroundColor: hasSelectedProperty ? '#f0f9ff' : '#ffffff',
                        border: 'none',
                        borderLeft: `4px solid ${group.status.color}`,
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                          {group.zoneName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {group.properties.length} properties · {group.weatherData?.pastSnow24h?.toFixed(1) || '0.0'}cm
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: group.status.color,
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>
                          {group.status.label}
                        </div>
                        <ChevronDownIcon
                          size={20}
                          color="#9ca3af"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}
                        />
                      </div>
                    </button>

                    {/* 展开的属性列表 */}
                    {isExpanded && (
                      <div style={{ backgroundColor: '#f9fafb' }}>
                        {group.properties.map(property => (
                          <button
                            key={property.id}
                            onClick={() => onSelectProperty(property)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px 20px 14px 40px',
                              backgroundColor: property.id === selectedPropertyId ? '#e0f2fe' : 'transparent',
                              border: 'none',
                              borderBottom: '1px solid #e5e7eb',
                              cursor: 'pointer',
                              textAlign: 'left',
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            <MapPinIcon size={14} color={group.status.color} />
                            <span style={{
                              flex: 1,
                              fontSize: '0.9rem',
                              color: '#374151',
                              fontWeight: property.id === selectedPropertyId ? 600 : 400
                            }}>
                              {property.address}
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: '#9ca3af',
                              textTransform: 'uppercase'
                            }}>
                              {property.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

/**
 * 主组件
 */
const MobileDriverModeSimple: React.FC<MobileDriverModeSimpleProps> = (props) => {
  const deviceInfo = useDeviceInfo();

  // 计算最大降雪量
  const allSnow = Array.from(props.weatherData.values()).map(d => d.pastSnow24h);
  const maxSnow = allSnow.length ? Math.max(...allSnow) : 0;

  return (
    <>
      <TopBar
        temperature={props.temperature}
        maxSnow={maxSnow}
        isSnowing={props.isSnowing}
        onRefresh={props.onRefresh}
      />

      <BottomSheet
        weatherData={props.weatherData}
        geoJsonData={props.geoJsonData}
        selectedPropertyId={props.selectedPropertyId}
        onSelectProperty={props.onSelectProperty}
        selectedFeature={props.selectedFeature}
        onClearSelection={props.onClearSelection}
        safeAreaBottom={deviceInfo.safeAreaInsets.bottom}
      />
    </>
  );
};

export default MobileDriverModeSimple;
