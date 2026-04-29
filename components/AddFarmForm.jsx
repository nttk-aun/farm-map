'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import FarmNavTabs from '@/components/ui/FarmNavTabs';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [13.736717, 100.523186];
const DEFAULT_ZOOM = 6;

function createPickerIcon() {
  try {
    return L.divIcon({
      className: 'farm-picker-marker',
      html: `
        <div style="
          width:28px;height:28px;border-radius:999px;
          background:#ef4444;border:3px solid #ffffff;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
        "></div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  } catch (error) {
    console.error('createPickerIcon error:', error);
    return L.divIcon();
  }
}

function normalizeCoordinate(value, fallbackValue) {
  try {
    const parsedValue = Number.parseFloat(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
    return fallbackValue;
  } catch (error) {
    console.error('normalizeCoordinate error:', error);
    return fallbackValue;
  }
}

function MapClickToUpdate({ onCoordinateChange }) {
  useMapEvents({
    click(event) {
      try {
        onCoordinateChange(event.latlng.lat, event.latlng.lng);
      } catch (error) {
        console.error('MapClickToUpdate click error:', error);
      }
    },
  });
  return null;
}

export default function AddFarmForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    provinceId: '',
    districtId: '',
    subdistrictId: '',
    lat: '',
    lon: '',
    addressLine: '',
    animalTypeIds: [],
  });
  const [meta, setMeta] = useState({
    provinces: [],
    districts: [],
    subdistricts: [],
    animalTypes: [],
  });
  const [statusText, setStatusText] = useState('กำลังโหลดข้อมูลตัวเลือก...');
  const [isSaving, setIsSaving] = useState(false);
  const [pickerIcon] = useState(() => createPickerIcon());

  const districtOptions = useMemo(() => {
    try {
      return meta.districts.filter((item) => String(item.province_id) === String(form.provinceId));
    } catch (error) {
      console.error('districtOptions error:', error);
      return [];
    }
  }, [meta.districts, form.provinceId]);

  const subdistrictOptions = useMemo(() => {
    try {
      return meta.subdistricts.filter((item) => String(item.district_id) === String(form.districtId));
    } catch (error) {
      console.error('subdistrictOptions error:', error);
      return [];
    }
  }, [meta.subdistricts, form.districtId]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const response = await fetch('/api/farms/meta', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setMeta({
          provinces: Array.isArray(data.provinces) ? data.provinces : [],
          districts: Array.isArray(data.districts) ? data.districts : [],
          subdistricts: Array.isArray(data.subdistricts) ? data.subdistricts : [],
          animalTypes: Array.isArray(data.animalTypes) ? data.animalTypes : [],
        });
        setStatusText('พร้อมเพิ่มข้อมูลฟาร์ม');
      } catch (error) {
        console.error('loadMeta error:', error);
        setStatusText('โหลดข้อมูลตัวเลือกไม่สำเร็จ');
      }
    };

    try {
      loadMeta();
    } catch (error) {
      console.error('useEffect loadMeta error:', error);
      setStatusText('เกิดข้อผิดพลาดระหว่างเริ่มต้นฟอร์ม');
    }
  }, []);

  const handleInputChange = (event) => {
    try {
      const { name, value } = event.target;
      setForm((prev) => {
        if (name === 'provinceId') {
          return { ...prev, provinceId: value, districtId: '', subdistrictId: '' };
        }
        if (name === 'districtId') {
          return { ...prev, districtId: value, subdistrictId: '' };
        }
        return { ...prev, [name]: value };
      });
    } catch (error) {
      console.error('handleInputChange error:', error);
    }
  };

  const handleAnimalToggle = (animalId) => {
    try {
      setForm((prev) => {
        const exists = prev.animalTypeIds.includes(animalId);
        if (exists) {
          return {
            ...prev,
            animalTypeIds: prev.animalTypeIds.filter((id) => id !== animalId),
          };
        }
        return {
          ...prev,
          animalTypeIds: [...prev.animalTypeIds, animalId],
        };
      });
    } catch (error) {
      console.error('handleAnimalToggle error:', error);
    }
  };

  const handleCoordinateChange = (lat, lon) => {
    try {
      setForm((prev) => ({
        ...prev,
        lat: Number(lat).toFixed(6),
        lon: Number(lon).toFixed(6),
      }));
    } catch (error) {
      console.error('handleCoordinateChange error:', error);
    }
  };

  const selectedLatitude = useMemo(() => {
    try {
      return normalizeCoordinate(form.lat, DEFAULT_CENTER[0]);
    } catch (error) {
      console.error('selectedLatitude useMemo error:', error);
      return DEFAULT_CENTER[0];
    }
  }, [form.lat]);

  const selectedLongitude = useMemo(() => {
    try {
      return normalizeCoordinate(form.lon, DEFAULT_CENTER[1]);
    } catch (error) {
      console.error('selectedLongitude useMemo error:', error);
      return DEFAULT_CENTER[1];
    }
  }, [form.lon]);

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();
      setIsSaving(true);
      setStatusText('กำลังบันทึกข้อมูลฟาร์ม...');

      const response = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      setStatusText('บันทึกสำเร็จ กำลังกลับไปหน้าแผนที่...');
      router.push('/farm-map');
      router.refresh();
    } catch (error) {
      console.error('handleSubmit error:', error);
      setStatusText('บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="ui-page">
      <div className="ui-header">
        <div>
          <h1 className="ui-header-title">เพิ่มข้อมูลฟาร์ม</h1>
          <p className="ui-header-subtitle">กรอกข้อมูลฟาร์มใหม่และบันทึกลงฐานข้อมูล</p>
        </div>
        <FarmNavTabs />
      </div>

      <div className="ui-card">
        <p className="ui-status">{statusText}</p>

        <form onSubmit={handleSubmit} className="ui-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="ui-label">เลือกพิกัดบนแผนที่</label>
            <p style={{ margin: '0 0 8px', color: 'var(--muted)', fontSize: 13 }}>
              คลิกบนแผนที่หรือเลื่อนหมุดเพื่ออัปเดต Latitude/Longitude อัตโนมัติ
            </p>
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <MapContainer
                center={[selectedLatitude, selectedLongitude]}
                zoom={DEFAULT_ZOOM}
                minZoom={5}
                style={{ width: '100%', height: 280 }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[selectedLatitude, selectedLongitude]}
                  icon={pickerIcon}
                  draggable
                  eventHandlers={{
                    dragend(event) {
                      try {
                        const updatedLatLng = event.target.getLatLng();
                        handleCoordinateChange(updatedLatLng.lat, updatedLatLng.lng);
                      } catch (error) {
                        console.error('Map marker dragend error:', error);
                      }
                    },
                  }}
                />
                <MapClickToUpdate onCoordinateChange={handleCoordinateChange} />
              </MapContainer>
            </div>
          </div>

          <div>
            <label className="ui-label">ชื่อฟาร์ม</label>
            <input className="ui-input" name="name" placeholder="ชื่อฟาร์ม" value={form.name} onChange={handleInputChange} required />
          </div>

          <div>
            <label className="ui-label">จังหวัด</label>
            <select className="ui-select" name="provinceId" value={form.provinceId} onChange={handleInputChange} required>
              <option value="">เลือกจังหวัด</option>
              {meta.provinces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name_th}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ui-label">อำเภอ</label>
            <select className="ui-select" name="districtId" value={form.districtId} onChange={handleInputChange} required>
              <option value="">เลือกอำเภอ</option>
              {districtOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name_th}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ui-label">ตำบล (ถ้ามี)</label>
            <select className="ui-select" name="subdistrictId" value={form.subdistrictId} onChange={handleInputChange}>
              <option value="">เลือกตำบล</option>
              {subdistrictOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name_th}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ui-label">Latitude</label>
            <input className="ui-input" name="lat" placeholder="13.985667" value={form.lat} onChange={handleInputChange} required />
          </div>

          <div>
            <label className="ui-label">Longitude</label>
            <input className="ui-input" name="lon" placeholder="100.60225" value={form.lon} onChange={handleInputChange} required />
          </div>

          <div>
            <label className="ui-label">ที่อยู่เพิ่มเติม</label>
            <textarea
              className="ui-textarea"
              name="addressLine"
              placeholder="ที่อยู่เพิ่มเติม"
              value={form.addressLine}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div>
            <label className="ui-label">ประเภทสัตว์</label>
            <div className="ui-checkbox-group">
              {meta.animalTypes.map((animal) => (
                <label key={animal.id} className="ui-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.animalTypeIds.includes(animal.id)}
                    onChange={() => handleAnimalToggle(animal.id)}
                  />
                  {animal.name_th} ({animal.code})
                </label>
              ))}
            </div>
          </div>

          <div className="ui-actions">
            <button className="ui-btn ui-btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกฟาร์ม'}
            </button>
            <button className="ui-btn ui-btn-secondary" type="button" onClick={() => router.push('/farm-map')}>
              กลับหน้าแผนที่
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
