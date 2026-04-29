import EditFarmForm from '@/components/EditFarmForm';

export default function EditFarmPage({ params }) {
  try {
    return <EditFarmForm farmId={params?.id} />;
  } catch (error) {
    console.error('EditFarmPage error:', error);
    return <div style={{ padding: 16 }}>ไม่สามารถโหลดหน้าแก้ไขฟาร์มได้</div>;
  }
}
