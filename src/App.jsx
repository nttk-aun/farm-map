import React, { useEffect, useRef } from 'react';

function App() {
  const mapRef = useRef(null); // ใช้สำหรับอ้างอิง div ที่จะวางแผนที่

  useEffect(() => {
    // ฟังก์ชันสร้างแผนที่
    const initMap = () => {
      // สร้าง Object แผนที่ไปวางที่ div ที่มี id="map-container"
      const map = new window.longdo.Map({
        placeholder: document.getElementById('map-container')
      });

      // ตั้งค่าเริ่มต้น
      map.Config.zoom(6);
      map.location({ lon: 100.5, lat: 13.7 });
      
      // ทดลองปักหมุดจำลอง (เดี๋ยวค่อยเอาออกเมื่อมีข้อมูลจริง)
      map.Overlays.add(new window.longdo.Marker({ lon: 100.5, lat: 13.7 }, {
        title: 'ฟาร์มตัวอย่าง',
        detail: 'ตั้งอยู่ที่กรุงเทพฯ'
      }));
    };

    // ตรวจสอบว่า Script ของ Longdo โหลดเสร็จหรือยัง
    if (window.longdo) {
      initMap();
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: '15px', background: '#2c3e50', color: 'white' }}>
        <h2 style={{ margin: 0 }}>🇹🇭 Thailand Farm Map</h2>
      </nav>
      
      {/* ส่วนแสดงแผนที่ */}
      <div 
        id="map-container" 
        style={{ flex: 1, width: '100%', height: '100%' }}
      ></div>
    </div>
  );
}

export default App;