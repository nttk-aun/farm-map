import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getDbPool();
    const [totalRes, byProvinceRes, byAnimalRes] = await Promise.all([
      pool.query('select count(*)::int as total_farms from farm.farms'),
      pool.query(`
        select p.name_th as province, count(*)::int as total
        from farm.farms f
        join farm.provinces p on p.id = f.province_id
        group by p.name_th
        order by total desc, p.name_th asc
        limit 10
      `),
      pool.query(`
        select at.name_th as animal, count(distinct fa.farm_id)::int as total
        from farm.farm_animals fa
        join farm.animal_types at on at.id = fa.animal_type_id
        group by at.name_th
        order by total desc, at.name_th asc
      `),
    ]);

    return NextResponse.json({
      totalFarms: totalRes.rows[0]?.total_farms || 0,
      topProvinces: byProvinceRes.rows,
      byAnimalTypes: byAnimalRes.rows,
    });
  } catch (error) {
    console.error('GET /api/farms/dashboard error:', error);
    return NextResponse.json({ message: 'ไม่สามารถโหลดข้อมูล dashboard ได้' }, { status: 500 });
  }
}
