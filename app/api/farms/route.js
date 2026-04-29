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

export async function GET(request) {
  try {
    const pool = getDbPool();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.trim();
    const provinceId = parseNumber(searchParams.get('provinceId'));
    const districtId = parseNumber(searchParams.get('districtId'));
    const animalTypeId = parseNumber(searchParams.get('animalTypeId'));
    const provinceName = searchParams.get('provinceName')?.trim();
    const districtName = searchParams.get('districtName')?.trim();
    const animalName = searchParams.get('animalName')?.trim();
    const page = Math.max(parseNumber(searchParams.get('page')) || 1, 1);
    const pageSize = Math.min(Math.max(parseNumber(searchParams.get('pageSize')) || 10, 1), 100);

    const whereClauses = [];
    const values = [];
    let idx = 1;

    if (name) {
      whereClauses.push(`f.name ilike $${idx}`);
      values.push(`%${name}%`);
      idx += 1;
    }
    if (provinceId) {
      whereClauses.push(`f.province_id = $${idx}`);
      values.push(provinceId);
      idx += 1;
    }
    if (districtId) {
      whereClauses.push(`f.district_id = $${idx}`);
      values.push(districtId);
      idx += 1;
    }
    if (provinceName) {
      whereClauses.push(`p.name_th ilike $${idx}`);
      values.push(`%${provinceName}%`);
      idx += 1;
    }
    if (districtName) {
      whereClauses.push(`d.name_th ilike $${idx}`);
      values.push(`%${districtName}%`);
      idx += 1;
    }
    if (animalTypeId) {
      whereClauses.push(`
        exists (
          select 1
          from farm.farm_animals fa2
          where fa2.farm_id = f.id
            and fa2.animal_type_id = $${idx}
        )
      `);
      values.push(animalTypeId);
      idx += 1;
    }
    if (animalName) {
      whereClauses.push(`
        exists (
          select 1
          from farm.farm_animals fa3
          join farm.animal_types at3 on at3.id = fa3.animal_type_id
          where fa3.farm_id = f.id
            and (at3.name_th ilike $${idx} or at3.code ilike $${idx})
        )
      `);
      values.push(`%${animalName}%`);
      idx += 1;
    }

    const whereSql = whereClauses.length > 0 ? `where ${whereClauses.join(' and ')}` : '';
    const countQuery = `
      select count(*)::int as total
      from farm.farms f
      join farm.provinces p on p.id = f.province_id
      join farm.districts d on d.id = f.district_id
      ${whereSql};
    `;
    const countResult = await pool.query(countQuery, values);
    const totalCount = countResult.rows[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    const pagedValues = [...values, pageSize, offset];
    const query = `
      select
        f.id,
        f.name,
        f.latitude as lat,
        f.longitude as lon,
        f.address_line,
        f.status,
        p.name_th as province,
        d.name_th as district,
        s.name_th as subdistrict,
        coalesce(
          (
            array_agg(at.code order by at.code)
            filter (where at.code is not null)
          ),
          '{}'
        ) as animal_types,
        coalesce(
          (
            array_agg(at.name_th order by at.name_th)
            filter (where at.name_th is not null)
          ),
          '{}'
        ) as animal_labels
      from farm.farms f
      join farm.provinces p on p.id = f.province_id
      join farm.districts d on d.id = f.district_id
      left join farm.subdistricts s on s.id = f.subdistrict_id
      left join farm.farm_animals fa on fa.farm_id = f.id
      left join farm.animal_types at on at.id = fa.animal_type_id
      ${whereSql}
      group by f.id, p.name_th, d.name_th, s.name_th
      order by f.id desc
      limit $${idx}
      offset $${idx + 1};
    `;

    const result = await pool.query(query, pagedValues);
    return NextResponse.json({
      farms: result.rows,
      pagination: {
        page: safePage,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/farms error:', error);
    return NextResponse.json(
      { message: 'ไม่สามารถดึงข้อมูลฟาร์มจากฐานข้อมูลได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const latitude = parseNumber(body?.lat);
    const longitude = parseNumber(body?.lon);
    const provinceId = parseNumber(body?.provinceId);
    const districtId = parseNumber(body?.districtId);
    const subdistrictId = body?.subdistrictId ? parseNumber(body?.subdistrictId) : null;
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

    const insertFarmQuery = `
      insert into farm.farms (
        name,
        province_id,
        district_id,
        subdistrict_id,
        address_line,
        latitude,
        longitude,
        status
      ) values ($1, $2, $3, $4, $5, $6, $7, 'active')
      returning id;
    `;

    const insertFarmValues = [
      name,
      provinceId,
      districtId,
      subdistrictId,
      addressLine,
      latitude,
      longitude,
    ];

    const farmResult = await client.query(insertFarmQuery, insertFarmValues);
    const farmId = farmResult.rows[0]?.id;

    if (farmId && animalTypeIds.length > 0) {
      const insertAnimalQuery = `
        insert into farm.farm_animals (farm_id, animal_type_id)
        values ($1, $2)
        on conflict (farm_id, animal_type_id) do nothing;
      `;

      for (const animalTypeId of animalTypeIds) {
        await client.query(insertAnimalQuery, [farmId, animalTypeId]);
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'เพิ่มข้อมูลฟาร์มสำเร็จ', farmId }, { status: 201 });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('POST /api/farms rollback error:', rollbackError);
      }
    }
    console.error('POST /api/farms error:', error);
    return NextResponse.json({ message: 'ไม่สามารถเพิ่มข้อมูลฟาร์มได้' }, { status: 500 });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('POST /api/farms release error:', releaseError);
      }
    }
  }
}
