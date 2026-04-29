import AddFarmForm from '@/components/AddFarmForm';

export default function AddFarmPage() {
  try {
    return <AddFarmForm />;
  } catch (error) {
    console.error('AddFarmPage error:', error);
    return <div style={{ padding: 16 }}>ไม่สามารถโหลดหน้าเพิ่มข้อมูลฟาร์มได้</div>;
  }
}
