'use client';

import React, { useEffect, useState } from 'react';
import FarmNavTabs from '@/components/ui/FarmNavTabs';

export default function FarmDashboard() {
  const [data, setData] = useState({
    totalFarms: 0,
    topProvinces: [],
    byAnimalTypes: [],
  });
  const [statusText, setStatusText] = useState('กำลังโหลด dashboard...');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/farms/dashboard', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const json = await response.json();
        setData({
          totalFarms: json?.totalFarms || 0,
          topProvinces: Array.isArray(json?.topProvinces) ? json.topProvinces : [],
          byAnimalTypes: Array.isArray(json?.byAnimalTypes) ? json.byAnimalTypes : [],
        });
        setStatusText('โหลด dashboard สำเร็จ');
      } catch (error) {
        console.error('loadDashboard error:', error);
        setStatusText('โหลด dashboard ไม่สำเร็จ');
      }
    };

    try {
      loadDashboard();
    } catch (error) {
      console.error('useEffect loadDashboard error:', error);
      setStatusText('เกิดข้อผิดพลาดระหว่างเริ่มต้น dashboard');
    }
  }, []);

  return (
    <main className="ui-page">
      <div className="ui-header">
        <div>
          <h1 className="ui-header-title">Dashboard ฟาร์ม</h1>
          <p className="ui-header-subtitle">สรุปภาพรวมจำนวนฟาร์ม จังหวัด และชนิดสัตว์</p>
        </div>
        <FarmNavTabs />
      </div>

      <p className="ui-status">{statusText}</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="ui-card">
          <div style={{ fontSize: 13, color: '#666' }}>จำนวนฟาร์มทั้งหมด</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{data.totalFarms}</div>
        </div>
      </section>

      <section style={{ marginTop: 20 }} className="ui-card">
        <h2>Top จังหวัด (10 อันดับ)</h2>
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>จังหวัด</th>
                <th>จำนวนฟาร์ม</th>
              </tr>
            </thead>
            <tbody>
              {data.topProvinces.map((item) => (
                <tr key={item.province}>
                  <td>{item.province}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
              {data.topProvinces.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ color: '#666' }}>
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 20 }} className="ui-card">
        <h2>จำนวนฟาร์มแยกตามชนิดสัตว์</h2>
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>ชนิดสัตว์</th>
                <th>จำนวนฟาร์ม</th>
              </tr>
            </thead>
            <tbody>
              {data.byAnimalTypes.map((item) => (
                <tr key={item.animal}>
                  <td>{item.animal}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
              {data.byAnimalTypes.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ color: '#666' }}>
                    ยังไม่มีข้อมูล
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
