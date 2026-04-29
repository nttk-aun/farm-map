'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import FarmNavTabs from '@/components/ui/FarmNavTabs';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

const DEFAULT_CENTER = [13.736717, 100.523186];
const DEFAULT_ZOOM = 6;
const ANIMAL_STYLES = {
  fish: { label: 'ปลา', icon: '/icons/farm-animals/fish.png', color: '#0EA5E9', tint: '#E0F2FE' },
  cow: { label: 'วัว', icon: '/icons/farm-animals/cow.png', color: '#8B5E3C', tint: '#F4E7DA' },
  pig: { label: 'หมู', icon: '/icons/farm-animals/pig.png', color: '#EC4899', tint: '#FCE7F3' },
  duck: { label: 'เป็ด', icon: '/icons/farm-animals/duck.png', color: '#F59E0B', tint: '#FEF3C7' },
  chicken: { label: 'ไก่', icon: '/icons/farm-animals/chicken.png', color: '#EF4444', tint: '#FEE2E2' },
};

function getAnimalLabel(animalType) {
  try {
    return ANIMAL_STYLES[animalType]?.label || animalType;
  } catch (error) {
    console.error('getAnimalLabel error:', error);
    return animalType;
  }
}

function getAnimalStyle(animalType) {
  try {
    return ANIMAL_STYLES[animalType] || {
      label: animalType,
      icon: '',
      color: '#2563EB',
      tint: '#DBEAFE',
    };
  } catch (error) {
    console.error('getAnimalStyle error:', error);
    return { label: animalType, icon: '', color: '#2563EB', tint: '#DBEAFE' };
  }
}

function getMarkerSizeByZoom(zoomLevel) {
  try {
    if (zoomLevel <= 6) return 26;
    if (zoomLevel <= 8) return 28;
    if (zoomLevel <= 10) return 32;
    if (zoomLevel <= 12) return 34;
    return 36;
  } catch (error) {
    console.error('getMarkerSizeByZoom error:', error);
    return 30;
  }
}

function createFarmIcon(animalType, size) {
  try {
    const animalStyle = getAnimalStyle(animalType);
    const borderWidth = Math.max(Math.floor(size * 0.08), 2);
    const padding = Math.max(Math.floor(size * 0.18), 4);
    return L.divIcon({
      className: 'farm-marker',
      html: `
        <div style="
          width:${size}px;height:${size}px;border-radius:999px;
          background:linear-gradient(180deg,#ffffff 0%, ${animalStyle.tint} 100%);
          border:${borderWidth}px solid ${animalStyle.color};
          box-shadow:0 6px 14px rgba(11,28,48,0.24);
          display:flex;align-items:center;justify-content:center;
          padding:${padding}px;
        ">
          <img
            src="${animalStyle.icon}"
            alt="${animalStyle.label}"
            style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.2));"
          />
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  } catch (error) {
    console.error('createFarmIcon error:', error);
    return L.divIcon();
  }
}

function createClusterIcon(cluster) {
  try {
    const count = cluster.getChildCount();
    let bg = '#93C5FD';
    let text = '#1E3A8A';
    if (count >= 10 && count < 50) {
      bg = '#60A5FA';
      text = '#0B3B8C';
    }
    if (count >= 50) {
      bg = '#2563EB';
      text = '#FFFFFF';
    }

    return L.divIcon({
      html: `
        <div style="
          width:42px;height:42px;border-radius:999px;
          background:${bg};
          border:2px solid rgba(255,255,255,0.9);
          box-shadow:0 8px 20px rgba(11,28,48,0.28);
          display:flex;align-items:center;justify-content:center;
          color:${text};
          font-size:13px;font-weight:800;
        ">${count}</div>
      `,
      className: 'farm-cluster-icon',
      iconSize: [42, 42],
    });
  } catch (error) {
    console.error('createClusterIcon error:', error);
    return L.divIcon();
  }
}

function buildGoogleMapsUrl(lat, lon) {
  try {
    if (lat === undefined || lon === undefined || lat === null || lon === null) {
      return 'https://www.google.com/maps';
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  } catch (error) {
    console.error('buildGoogleMapsUrl error:', error);
    return 'https://www.google.com/maps';
  }
}

function ZoomWatcher({ setZoomLevel }) {
  useMapEvents({
    zoomend(event) {
      try {
        setZoomLevel(event.target.getZoom());
      } catch (error) {
        console.error('zoomend handler error:', error);
      }
    },
  });
  return null;
}

export default function FarmMap() {
  const [farms, setFarms] = useState([]);
  const [statusText, setStatusText] = useState('กำลังโหลดข้อมูลฟาร์ม...');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const markerSize = useMemo(() => getMarkerSizeByZoom(zoomLevel), [zoomLevel]);

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const response = await fetch('/api/farms', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        const farmList = Array.isArray(data.farms) ? data.farms : [];
        setFarms(farmList);
        setStatusText(`โหลดข้อมูลสำเร็จ ${farmList.length} ฟาร์ม`);
      } catch (error) {
        console.error('loadFarms error:', error);
        setStatusText('โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ');
      }
    };

    try {
      loadFarms();
    } catch (error) {
      console.error('useEffect loadFarms error:', error);
      setStatusText('เกิดข้อผิดพลาดระหว่างเริ่มโหลดข้อมูล');
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, color: 'var(--text)' }}>Thailand Farm Map</h2>
          <FarmNavTabs />
        </div>
      </nav>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={5}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomWatcher setZoomLevel={setZoomLevel} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={46}
          iconCreateFunction={createClusterIcon}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {farms.map((farm) => (
            <Marker
              key={farm.id}
              position={[farm.lat, farm.lon]}
              icon={createFarmIcon(farm.animal_types?.[0], markerSize)}
            >
              <Popup>
                <strong>{farm.name}</strong>
                <br />
                ประเภท: {getAnimalLabel(farm.animal_types?.[0])}
                <br />
                พิกัด: {farm.lat}, {farm.lon}
                <br />
                ที่อยู่: {farm.address_line || '-'}
                <br />
                จังหวัด/อำเภอ: {farm.province} / {farm.district}
                <br />
                <a
                  href={buildGoogleMapsUrl(farm.lat, farm.lon)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    textDecoration: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  นำทางด้วย Google Maps
                </a>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      <div
        className="ui-card"
        style={{ position: 'fixed', left: 12, bottom: 12, fontSize: 13, padding: '8px 12px' }}
      >
        {statusText}
      </div>
    </div>
  );
}
