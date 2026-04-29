import dynamic from 'next/dynamic';

const AddFarmForm = dynamic(() => import('@/components/AddFarmForm'), {
  ssr: false,
  loading: () => <div style={{ padding: 16 }}>กำลังโหลดหน้าเพิ่มข้อมูลฟาร์ม...</div>,
});

export default function AddFarmPage() {
  try {
    return <AddFarmForm />;
  } catch (error) {
    console.error('AddFarmPage error:', error);
    return <div style={{ padding: 16 }}>ไม่สามารถโหลดหน้าเพิ่มข้อมูลฟาร์มได้</div>;
  }
}
