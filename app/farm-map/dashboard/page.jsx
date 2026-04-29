import FarmDashboard from '@/components/FarmDashboard';

export default function FarmDashboardPage() {
  try {
    return <FarmDashboard />;
  } catch (error) {
    console.error('FarmDashboardPage error:', error);
    return <div style={{ padding: 16 }}>ไม่สามารถโหลดหน้า Dashboard ได้</div>;
  }
}
