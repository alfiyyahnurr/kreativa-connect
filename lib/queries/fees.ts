import { sql } from '@/lib/db/neon';
import { redisGetOrSet, redisDel } from '@/lib/redis/cache';

export interface FeeItem {
  id: string;
  fee_structure_id: string;
  grade_label: string;
  grade_order: number;
  item_name: string;
  fee_category: string;
  billing_period: string;
  period_label: string;
  amount: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  campus: string;
  academic_year: string;
  edu_level: string;
  level_name: string;
  scheme_name: string;
  registration_fee: number | string;
  currency: string;
  inclusions: string | null;
  exclusions: string | null;
  notes: string | null;
  brochure_url: string | null;
  matrix_json: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeStructureWithItems extends FeeStructure {
  items: FeeItem[];
}

export async function getFeeStructuresBySchool(
  schoolId: number | string,
  options?: { campus?: string; edu_level?: string; activeOnly?: boolean }
): Promise<FeeStructureWithItems[]> {
  const cacheKey = `fees:school:${schoolId}:active`;
  const activeOnly = options?.activeOnly !== false;

  return await redisGetOrSet(cacheKey, 3600, async () => {
    let structures: FeeStructure[] = [];

    if (options?.campus && options?.edu_level) {
      structures = (await sql`
        SELECT * FROM fee_structures
        WHERE school_id = ${schoolId}
          AND campus = ${options.campus}
          AND edu_level = ${options.edu_level}
          AND is_active = ${activeOnly}
        ORDER BY edu_level ASC, scheme_name ASC
      `) as FeeStructure[];
    } else if (options?.campus) {
      structures = (await sql`
        SELECT * FROM fee_structures
        WHERE school_id = ${schoolId}
          AND campus = ${options.campus}
          AND is_active = ${activeOnly}
        ORDER BY edu_level ASC, scheme_name ASC
      `) as FeeStructure[];
    } else {
      structures = (await sql`
        SELECT * FROM fee_structures
        WHERE school_id = ${schoolId}
          AND is_active = ${activeOnly}
        ORDER BY campus ASC, edu_level ASC, scheme_name ASC
      `) as FeeStructure[];
    }

    if (structures.length === 0) return [];

    const structureIds = structures.map((s) => s.id);
    const items = (await sql`
      SELECT * FROM fee_items
      WHERE fee_structure_id = ANY(${structureIds})
      ORDER BY fee_structure_id ASC, grade_order ASC, item_name ASC
    `) as FeeItem[];

    const itemsMap = new Map<string, FeeItem[]>();
    for (const item of items) {
      const sId = String(item.fee_structure_id);
      if (!itemsMap.has(sId)) {
        itemsMap.set(sId, []);
      }
      itemsMap.get(sId)!.push(item);
    }

    return structures.map((s) => ({
      ...s,
      items: itemsMap.get(String(s.id)) || [],
    }));
  });
}

export async function getFeeStructureById(id: number | string): Promise<FeeStructureWithItems | null> {
  const rows = (await sql`
    SELECT * FROM fee_structures
    WHERE id = ${id}
    LIMIT 1
  `) as FeeStructure[];

  if (rows.length === 0) return null;
  const structure = rows[0];

  const items = (await sql`
    SELECT * FROM fee_items
    WHERE fee_structure_id = ${id}
    ORDER BY grade_order ASC, item_name ASC
  `) as FeeItem[];

  return {
    ...structure,
    items,
  };
}

export async function invalidateFeeCache(schoolId: number | string): Promise<void> {
  await redisDel(`fees:school:${schoolId}:active`);
}
