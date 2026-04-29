import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

function parseNumber(value) {
  try {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  } catch (error) {
    console.error('parseNumber error:', error);
    return null;
  }
}

export async function GET(_request, { params }) {
  try {
    const farmId = parseNumber(params?.id);
    if (!farmId) {
      return NextResponse.json({ message: 'รูปแบบ id ไม่ถูกต้อง' }, { status: 400 });
    }

    const pool = getDbPool();
    const query = `
      select
        f.id,
        f.name,
        f.province_id,
        f.district_id,
        f.subdistrict_id,
        f.address_line,
        f.latitude as lat,
        f.longitude as lon,
        coalesce(
          (
            array_agg(at.id order by at.id)
            filter (where at.id is not null)
          ),
          '{}'
        ) as animal_type_ids
      from farm.farms f
      left join farm.farm_animals fa on fa.farm_id = f.id
      left join farm.animal_types at on at.id = fa.animal_type_id
      where f.id = $1
      group by f.id;
    `;
    const result = await pool.query(query, [farmId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลฟาร์ม' }, { status: 404 });
    }

    return NextResponse.json({ farm: result.rows[0] });
  } catch (error) {
    console.error('GET /api/farms/[id] error:', error);
    return NextResponse.json({ message: 'ไม่สามารถดึงข้อมูลฟาร์มได้' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  let client;
  try {
    const farmId = parseNumber(params?.id);
    if (!farmId) {
      return NextResponse.json({ message: 'รูปแบบ id ไม่ถูกต้อง' }, { status: 400 });
    }

    const body = await request.json();
    const name = body?.name?.trim();
    const latitude = parseNumber(body?.lat);
    const longitude = parseNumber(body?.lon);
    const provinceId = parseNumber(body?.provinceId);
    const districtId = parseNumber(body?.districtId);
    const subdistrictId = body?.subdistrictId ? parseNumber(body.subdistrictId) : null;
    const addressLine = body?.addressLine?.trim() || null;
    const animalTypeIds = Array.isArray(body?.animalTypeIds)
      ? body.animalTypeIds.map((id) => parseNumber(id)).filter(Boolean)
      : [];

    if (!name || latitude === null || longitude === null || !provinceId || !districtId) {
      return NextResponse.json(
        { message: 'ข้อมูลไม่ครบ: ต้องมีชื่อฟาร์ม จังหวัด อำเภอ และพิกัด' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    client = await pool.connect();
    await client.query('BEGIN');

    const updateQuery = `
      update farm.farms
      set
        name = $1,
        province_id = $2,
        district_id = $3,
        subdistrict_id = $4,
        address_line = $5,
        latitude = $6,
        longitude = $7,
        updated_at = now()
      where id = $8
      returning id;
    `;
    const updateValues = [
      name,
      provinceId,
      districtId,
      subdistrictId,
      addressLine,
      latitude,
      longitude,
      farmId,
    ];
    const updateResult = await client.query(updateQuery, updateValues);
    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'ไม่พบข้อมูลฟาร์มที่ต้องการแก้ไข' }, { status: 404 });
    }

    await client.query('delete from farm.farm_animals where farm_id = $1', [farmId]);
    if (animalTypeIds.length > 0) {
      for (const animalTypeId of animalTypeIds) {
        await client.query(
          `
            insert into farm.farm_animals (farm_id, animal_type_id)
            values ($1, $2)
            on conflict (farm_id, animal_type_id) do nothing
          `,
          [farmId, animalTypeId]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'แก้ไขข้อมูลฟาร์มสำเร็จ', id: farmId });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('PUT /api/farms/[id] rollback error:', rollbackError);
      }
    }
    console.error('PUT /api/farms/[id] error:', error);
    return NextResponse.json({ message: 'ไม่สามารถแก้ไขข้อมูลฟาร์มได้' }, { status: 500 });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('PUT /api/farms/[id] release error:', releaseError);
      }
    }
  }
}

export async function DELETE(_request, { params }) {
  try {
    const farmId = parseNumber(params?.id);
    if (!farmId) {
      return NextResponse.json({ message: 'รูปแบบ id ไม่ถูกต้อง' }, { status: 400 });
    }

    const pool = getDbPool();
    const result = await pool.query('delete from farm.farms where id = $1 returning id', [farmId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'ไม่พบข้อมูลฟาร์มที่ต้องการลบ' }, { status: 404 });
    }

    return NextResponse.json({ message: 'ลบข้อมูลฟาร์มสำเร็จ', id: result.rows[0].id });
  } catch (error) {
    console.error('DELETE /api/farms/[id] error:', error);
    return NextResponse.json({ message: 'ไม่สามารถลบข้อมูลฟาร์มได้' }, { status: 500 });
  }
}
