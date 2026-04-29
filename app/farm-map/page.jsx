import dynamic from 'next/dynamic';

const FarmMap = dynamic(() => import('@/components/FarmMap'), {
  ssr: false,
  loading: () => <div style={{ padding: 16 }}>กำลังโหลดแผนที่...</div>,
});

export default function FarmMapPage() {
  try {
    return <FarmMap />;
  } catch (error) {
    console.error('FarmMapPage error:', error);
    return <div style={{ padding: 16 }}>ไม่สามารถโหลดหน้าแผนที่ได้</div>;
  }
}
