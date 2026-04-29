import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDbPool();
    const [provincesRes, districtsRes, subdistrictsRes, animalTypesRes] = await Promise.all([
      pool.query('select id, name_th from farm.provinces order by name_th asc'),
      pool.query('select id, province_id, name_th from farm.districts order by name_th asc'),
      pool.query('select id, district_id, name_th from farm.subdistricts order by name_th asc'),
      pool.query('select id, code, name_th from farm.animal_types order by name_th asc'),
    ]);

    return NextResponse.json({
      provinces: provincesRes.rows,
      districts: districtsRes.rows,
      subdistricts: subdistrictsRes.rows,
      animalTypes: animalTypesRes.rows,
    });
  } catch (error) {
    console.error('GET /api/farms/meta error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถดึงข้อมูลตัวเลือกฟอร์มได้' },
      { status: 500 }
    );
  }
}
