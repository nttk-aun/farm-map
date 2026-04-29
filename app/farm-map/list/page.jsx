import FarmList from '@/components/FarmList';

export default function FarmListPage() {
  try {
    return <FarmList />;
  } catch (error) {
    console.error('FarmListPage error:', error);
    return <div style={{ padding: 16 }}>ไม่สามารถโหลดหน้ารายการฟาร์มได้</div>;
  }
}
