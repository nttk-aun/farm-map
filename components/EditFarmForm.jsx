'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FarmNavTabs from '@/components/ui/FarmNavTabs';

export default function EditFarmForm({ farmId }) {
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
  const [statusText, setStatusText] = useState('กำลังโหลดข้อมูลฟาร์ม...');
  const [isSaving, setIsSaving] = useState(false);

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
    const loadMetaAndFarm = async () => {
      try {
        const [metaRes, farmRes] = await Promise.all([
          fetch('/api/farms/meta', { cache: 'no-store' }),
          fetch(`/api/farms/${farmId}`, { cache: 'no-store' }),
        ]);
        if (!metaRes.ok) throw new Error(`Meta request failed with status ${metaRes.status}`);
        if (!farmRes.ok) throw new Error(`Farm request failed with status ${farmRes.status}`);

        const [metaData, farmData] = await Promise.all([metaRes.json(), farmRes.json()]);
        const farm = farmData?.farm;

        setMeta({
          provinces: Array.isArray(metaData.provinces) ? metaData.provinces : [],
          districts: Array.isArray(metaData.districts) ? metaData.districts : [],
          subdistricts: Array.isArray(metaData.subdistricts) ? metaData.subdistricts : [],
          animalTypes: Array.isArray(metaData.animalTypes) ? metaData.animalTypes : [],
        });

        setForm({
          name: farm?.name || '',
          provinceId: farm?.province_id ? String(farm.province_id) : '',
          districtId: farm?.district_id ? String(farm.district_id) : '',
          subdistrictId: farm?.subdistrict_id ? String(farm.subdistrict_id) : '',
          lat: farm?.lat ?? '',
          lon: farm?.lon ?? '',
          addressLine: farm?.address_line || '',
          animalTypeIds: Array.isArray(farm?.animal_type_ids) ? farm.animal_type_ids : [],
        });
        setStatusText('พร้อมแก้ไขข้อมูลฟาร์ม');
      } catch (error) {
        console.error('loadMetaAndFarm error:', error);
        setStatusText('โหลดข้อมูลฟาร์มไม่สำเร็จ');
      }
    };

    try {
      loadMetaAndFarm();
    } catch (error) {
      console.error('useEffect loadMetaAndFarm error:', error);
      setStatusText('เกิดข้อผิดพลาดระหว่างเริ่มต้นหน้าแก้ไข');
    }
  }, [farmId]);

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
          return { ...prev, animalTypeIds: prev.animalTypeIds.filter((id) => id !== animalId) };
        }
        return { ...prev, animalTypeIds: [...prev.animalTypeIds, animalId] };
      });
    } catch (error) {
      console.error('handleAnimalToggle error:', error);
    }
  };

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();
      setIsSaving(true);
      setStatusText('กำลังบันทึกการแก้ไข...');

      const response = await fetch(`/api/farms/${farmId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'แก้ไขข้อมูลไม่สำเร็จ');

      setStatusText('แก้ไขสำเร็จ กำลังกลับไปหน้ารายการ...');
      router.push('/farm-map/list');
      router.refresh();
    } catch (error) {
      console.error('handleSubmit error:', error);
      setStatusText('แก้ไขข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="ui-page">
      <div className="ui-header">
        <div>
          <h1 className="ui-header-title">แก้ไขข้อมูลฟาร์ม #{farmId}</h1>
          <p className="ui-header-subtitle">ปรับข้อมูลฟาร์มและบันทึกการเปลี่ยนแปลง</p>
        </div>
        <FarmNavTabs />
      </div>

      <div className="ui-card">
        <p className="ui-status">{statusText}</p>

        <form onSubmit={handleSubmit} className="ui-form-grid">
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
            <input className="ui-input" name="lat" placeholder="Latitude" value={form.lat} onChange={handleInputChange} required />
          </div>

          <div>
            <label className="ui-label">Longitude</label>
            <input className="ui-input" name="lon" placeholder="Longitude" value={form.lon} onChange={handleInputChange} required />
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
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
            <button className="ui-btn ui-btn-secondary" type="button" onClick={() => router.push('/farm-map/list')}>
              กลับหน้ารายการ
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
