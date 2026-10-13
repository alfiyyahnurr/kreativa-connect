import { sql } from '@/lib/db/neon';

export interface KnowledgeArticle {
  id: string;
  school_id: string;
  fee_structure_id: string | null;
  created_by_id: string | null;
  title: string;
  category: string;
  edu_level_scope: string;
  answer: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getKnowledgeBaseList(options?: {
  schoolId?: number | string;
  category?: string;
  search?: string;
  activeOnly?: boolean;
}): Promise<KnowledgeArticle[]> {
  const schoolId = options?.schoolId || 1;
  const activeOnly = options?.activeOnly !== false;

  let query;
  if (options?.category && options?.search) {
    const pattern = `%${options.search}%`;
    query = sql`
      SELECT * FROM knowledge_base
      WHERE school_id = ${schoolId}
        AND is_active = ${activeOnly}
        AND category = ${options.category}
        AND (title ILIKE ${pattern} OR answer ILIKE ${pattern})
      ORDER BY category ASC, title ASC
    `;
  } else if (options?.category) {
    query = sql`
      SELECT * FROM knowledge_base
      WHERE school_id = ${schoolId}
        AND is_active = ${activeOnly}
        AND category = ${options.category}
      ORDER BY title ASC
    `;
  } else if (options?.search) {
    const pattern = `%${options.search}%`;
    query = sql`
      SELECT * FROM knowledge_base
      WHERE school_id = ${schoolId}
        AND is_active = ${activeOnly}
        AND (title ILIKE ${pattern} OR answer ILIKE ${pattern})
      ORDER BY category ASC, title ASC
    `;
  } else {
    query = sql`
      SELECT * FROM knowledge_base
      WHERE school_id = ${schoolId}
        AND is_active = ${activeOnly}
      ORDER BY category ASC, title ASC
    `;
  }

  const rows = await query;
  return rows as KnowledgeArticle[];
}

export async function searchKnowledgeForGrounding(
  schoolId: number | string,
  userQuery: string,
  limit: number = 4
): Promise<KnowledgeArticle[]> {
  const pattern = `%${userQuery}%`;
  const rows = (await sql`
    SELECT id, school_id, fee_structure_id, created_by_id, title, category, edu_level_scope, answer, is_active, created_at, updated_at
    FROM knowledge_base
    WHERE school_id = ${schoolId}
      AND is_active = TRUE
      AND (
        title ILIKE ${pattern} 
        OR answer ILIKE ${pattern}
        OR to_tsvector('simple', title || ' ' || answer) @@ plainto_tsquery('simple', ${userQuery})
      )
    LIMIT ${limit}
  `) as KnowledgeArticle[];

  return rows;
}

export async function upsertKnowledgeArticle(data: {
  id?: number | string;
  schoolId: number | string;
  title: string;
  category: string;
  eduLevelScope?: string;
  answer: string;
  feeStructureId?: number | string | null;
}): Promise<void> {
  if (data.id) {
    await sql`
      UPDATE knowledge_base
      SET 
        title = ${data.title},
        category = ${data.category},
        edu_level_scope = ${data.eduLevelScope || 'all'},
        answer = ${data.answer},
        fee_structure_id = ${data.feeStructureId || null},
        updated_at = NOW()
      WHERE id = ${data.id}
    `;
  } else {
    await sql`
      INSERT INTO knowledge_base (
        school_id, title, category, edu_level_scope, answer, fee_structure_id
      ) VALUES (
        ${data.schoolId},
        ${data.title},
        ${data.category},
        ${data.eduLevelScope || 'all'},
        ${data.answer},
        ${data.feeStructureId || null}
      )
    `;
  }
}
