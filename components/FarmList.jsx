'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import FarmNavTabs from '@/components/ui/FarmNavTabs';

export default function FarmList() {
const defaultFilters = { name: '', provinceText: '', districtText: '', animalText: '' };
  const [filters, setFilters] = useState({
    ...defaultFilters,
  });
  const [meta, setMeta] = useState({
    provinces: [],
    districts: [],
    animalTypes: [],
  });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [statusText, setStatusText] = useState('กำลังโหลดข้อมูล...');
  const [isLoading, setIsLoading] = useState(false);

  const selectedProvince = useMemo(() => {
    try {
      return meta.provinces.find((item) => item.name_th === filters.provinceText) || null;
    } catch (error) {
      console.error('selectedProvince error:', error);
      return null;
    }
  }, [meta.provinces, filters.provinceText]);

  const districtOptions = useMemo(() => {
    try {
      if (!selectedProvince) return meta.districts;
      return meta.districts.filter((item) => item.province_id === selectedProvince.id);
    } catch (error) {
      console.error('districtOptions error:', error);
      return [];
    }
  }, [meta.districts, selectedProvince]);

  const selectedDistrict = useMemo(() => {
    try {
      return districtOptions.find((item) => item.name_th === filters.districtText) || null;
    } catch (error) {
      console.error('selectedDistrict error:', error);
      return null;
    }
  }, [districtOptions, filters.districtText]);

  const selectedAnimal = useMemo(() => {
    try {
      return (
        meta.animalTypes.find(
          (item) => item.name_th === filters.animalText || item.code === filters.animalText
        ) || null
      );
    } catch (error) {
      console.error('selectedAnimal error:', error);
      return null;
    }
  }, [meta.animalTypes, filters.animalText]);

  const loadMeta = async () => {
    try {
      const response = await fetch('/api/farms/meta', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      setMeta({
        provinces: Array.isArray(data.provinces) ? data.provinces : [],
        districts: Array.isArray(data.districts) ? data.districts : [],
        animalTypes: Array.isArray(data.animalTypes) ? data.animalTypes : [],
      });
    } catch (error) {
      console.error('loadMeta error:', error);
      setStatusText('โหลดข้อมูลตัวเลือกไม่สำเร็จ');
    }
  };

  const loadFarms = async (targetPage = pagination.page, activeFilters = filters) => {
    try {
      setIsLoading(true);
      setStatusText('กำลังค้นหาข้อมูลฟาร์ม...');
      const selectedProvinceLocal =
        meta.provinces.find((item) => item.name_th === activeFilters.provinceText) || null;
      const selectedDistrictLocal =
        (selectedProvinceLocal
          ? meta.districts.filter((item) => item.province_id === selectedProvinceLocal.id)
          : meta.districts
        ).find((item) => item.name_th === activeFilters.districtText) || null;
      const selectedAnimalLocal =
        meta.animalTypes.find(
          (item) => item.name_th === activeFilters.animalText || item.code === activeFilters.animalText
        ) || null;

      const params = new URLSearchParams();
      if (activeFilters.name.trim()) params.set('name', activeFilters.name.trim());
      if (selectedProvinceLocal) params.set('provinceId', String(selectedProvinceLocal.id));
      else if (activeFilters.provinceText.trim()) params.set('provinceName', activeFilters.provinceText.trim());
      if (selectedDistrictLocal) params.set('districtId', String(selectedDistrictLocal.id));
      else if (activeFilters.districtText.trim()) params.set('districtName', activeFilters.districtText.trim());
      if (selectedAnimalLocal) params.set('animalTypeId', String(selectedAnimalLocal.id));
      else if (activeFilters.animalText.trim()) params.set('animalName', activeFilters.animalText.trim());
      params.set('page', String(targetPage));
      params.set('pageSize', String(pagination.pageSize));

      const response = await fetch(`/api/farms?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const data = await response.json();
      const farmList = Array.isArray(data.farms) ? data.farms : [];
      const pageInfo = data?.pagination || {};
      const nextPagination = {
        page: Number(pageInfo.page) || targetPage,
        pageSize: Number(pageInfo.pageSize) || pagination.pageSize,
        totalCount: Number(pageInfo.totalCount) || 0,
        totalPages: Number(pageInfo.totalPages) || 1,
      };
      setRows(farmList);
      setPagination(nextPagination);
      const startRow = nextPagination.totalCount === 0 ? 0 : (nextPagination.page - 1) * nextPagination.pageSize + 1;
      const endRow = Math.min(nextPagination.page * nextPagination.pageSize, nextPagination.totalCount);
      setStatusText(`แสดง ${startRow}-${endRow} จากทั้งหมด ${nextPagination.totalCount} ฟาร์ม`);
    } catch (error) {
      console.error('loadFarms error:', error);
      setStatusText('โหลดข้อมูลฟาร์มไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadMeta();
        await loadFarms(1);
      } catch (error) {
        console.error('FarmList init error:', error);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    try {
      const { name, value } = event.target;
      setFilters((prev) => {
        if (name === 'provinceText') {
          return { ...prev, provinceText: value, districtText: '' };
        }
        return { ...prev, [name]: value };
      });
    } catch (error) {
      console.error('handleFilterChange error:', error);
    }
  };

  const handleDeleteFarm = async (farmId, farmName) => {
    try {
      const isConfirmed = window.confirm(`ต้องการลบฟาร์ม "${farmName}" ใช่หรือไม่?`);
      if (!isConfirmed) return;

      const response = await fetch(`/api/farms/${farmId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'ลบข้อมูลไม่สำเร็จ');

      const targetPage = rows.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      await loadFarms(targetPage);
    } catch (error) {
      console.error('handleDeleteFarm error:', error);
      setStatusText('ลบข้อมูลไม่สำเร็จ');
    }
  };

  const handleSearch = async (event) => {
    try {
      event.preventDefault();
      await loadFarms(1);
    } catch (error) {
      console.error('handleSearch error:', error);
    }
  };

  const handlePageChange = async (nextPage) => {
    try {
      if (nextPage < 1 || nextPage > pagination.totalPages || isLoading) return;
      await loadFarms(nextPage);
    } catch (error) {
      console.error('handlePageChange error:', error);
    }
  };

  return (
    <main className="ui-page">
      <div className="ui-header">
        <div>
          <h1 className="ui-header-title">รายการฟาร์มทั้งหมด</h1>
          <p className="ui-header-subtitle">ค้นหา แก้ไข และลบข้อมูลฟาร์มจากฐานข้อมูล</p>
        </div>
        <FarmNavTabs />
      </div>

      <form onSubmit={handleSearch} className="ui-card ui-form-grid" style={{ marginBottom: 12 }}>
        <input
          className="ui-input"
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
          placeholder="ค้นหาชื่อฟาร์ม"
        />

        <input
          className="ui-input"
          list="province-options"
          name="provinceText"
          value={filters.provinceText}
          onChange={handleFilterChange}
          placeholder="จังหวัด"
        />
        <datalist id="province-options">
          {meta.provinces.map((item) => (
            <option key={item.id} value={item.name_th} />
          ))}
        </datalist>

        <input
          className="ui-input"
          list="district-options"
          name="districtText"
          value={filters.districtText}
          onChange={handleFilterChange}
          placeholder="อำเภอ"
        />
        <datalist id="district-options">
          {districtOptions.map((item) => (
            <option key={item.id} value={item.name_th} />
          ))}
        </datalist>

        <input
          className="ui-input"
          list="animal-options"
          name="animalText"
          value={filters.animalText}
          onChange={handleFilterChange}
          placeholder="ชนิดสัตว์"
        />
        <datalist id="animal-options">
          {meta.animalTypes.map((item) => (
            <option key={item.id} value={item.name_th} />
          ))}
        </datalist>

        <div className="ui-actions">
          <button className="ui-btn ui-btn-primary" type="submit" disabled={isLoading}>
            ค้นหา
          </button>
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={async () => {
              try {
                setFilters(defaultFilters);
                await loadFarms(1, defaultFilters);
              } catch (error) {
                console.error('clear filters error:', error);
              }
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
      </form>

      <p className="ui-status">{statusText}</p>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อฟาร์ม</th>
              <th>จังหวัด</th>
              <th>อำเภอ</th>
              <th>ชนิดสัตว์</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.province}</td>
                <td>{item.district}</td>
                <td>
                  {Array.isArray(item.animal_labels) ? item.animal_labels.join(', ') : '-'}
                </td>
                <td>
                  <Link href={`/farm-map/edit/${item.id}`} style={{ marginRight: 8, fontWeight: 700 }}>
                    แก้ไข
                  </Link>
                  <button
                    className="ui-btn ui-btn-danger"
                    type="button"
                    onClick={() => handleDeleteFarm(item.id, item.name)}
                  >
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: '#666' }}>
                  ไม่พบข้อมูลฟาร์มตามเงื่อนไขค้นหา
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="ui-actions" style={{ justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          หน้า {pagination.page} / {pagination.totalPages}
        </span>
        <div className="ui-actions">
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isLoading}
          >
            ก่อนหน้า
          </button>
          <button
            className="ui-btn ui-btn-secondary"
            type="button"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </main>
  );
}
