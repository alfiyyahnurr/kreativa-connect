import { sql } from '@/lib/db/neon';

export interface ConversationListItem {
  id: string;
  school_id: string;
  contact_id: string;
  channel_id: string;
  assigned_user_id: string | null;
  topic: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  // Joins
  contact_name: string;
  contact_phone: string;
  contact_type: string;
  lead_temp: string | null;
  edu_level: string | null;
  channel_name: string;
  channel_type: string;
  assigned_name: string | null;
  last_message_content: string | null;
  last_message_time: string | null;
  last_message_role: string | null;
}

export interface ConversationFilter {
  schoolId?: number | string;
  status?: string;
  channelId?: number | string;
  search?: string;
  assignedUserId?: number | string;
  limit?: number;
  offset?: number;
}

export async function getConversationsList(filter: ConversationFilter = {}): Promise<ConversationListItem[]> {
  const schoolId = filter.schoolId || 1;
  const limit = filter.limit || 50;
  const offset = filter.offset || 0;

  let query;

  if (filter.status && filter.search) {
    const searchPattern = `%${filter.search}%`;
    query = sql`
      SELECT 
        c.id, c.school_id, c.contact_id, c.channel_id, c.assigned_user_id,
        c.topic, c.status, c.priority, c.created_at, c.updated_at,
        ct.full_name AS contact_name, ct.phone AS contact_phone,
        ct.contact_type, ct.lead_temp, ct.edu_level,
        ch.name AS channel_name, ch.type AS channel_type,
        u.display_name AS assigned_name,
        lm.content AS last_message_content,
        lm.created_at AS last_message_time,
        lm.role AS last_message_role
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      JOIN channels ch ON ch.id = c.channel_id
      LEFT JOIN users u ON u.id = c.assigned_user_id
      LEFT JOIN LATERAL (
        SELECT content, created_at, role
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.role IN ('parent', 'agent', 'internal_note')
          AND m.source IN ('human', 'system')
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE c.school_id = ${schoolId}
        AND c.status = ${filter.status}
        AND (ct.full_name ILIKE ${searchPattern} OR ct.phone ILIKE ${searchPattern} OR c.topic ILIKE ${searchPattern})
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (filter.status) {
    query = sql`
      SELECT 
        c.id, c.school_id, c.contact_id, c.channel_id, c.assigned_user_id,
        c.topic, c.status, c.priority, c.created_at, c.updated_at,
        ct.full_name AS contact_name, ct.phone AS contact_phone,
        ct.contact_type, ct.lead_temp, ct.edu_level,
        ch.name AS channel_name, ch.type AS channel_type,
        u.display_name AS assigned_name,
        lm.content AS last_message_content,
        lm.created_at AS last_message_time,
        lm.role AS last_message_role
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      JOIN channels ch ON ch.id = c.channel_id
      LEFT JOIN users u ON u.id = c.assigned_user_id
      LEFT JOIN LATERAL (
        SELECT content, created_at, role
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.role IN ('parent', 'agent', 'internal_note')
          AND m.source IN ('human', 'system')
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE c.school_id = ${schoolId}
        AND c.status = ${filter.status}
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (filter.search) {
    const searchPattern = `%${filter.search}%`;
    query = sql`
      SELECT 
        c.id, c.school_id, c.contact_id, c.channel_id, c.assigned_user_id,
        c.topic, c.status, c.priority, c.created_at, c.updated_at,
        ct.full_name AS contact_name, ct.phone AS contact_phone,
        ct.contact_type, ct.lead_temp, ct.edu_level,
        ch.name AS channel_name, ch.type AS channel_type,
        u.display_name AS assigned_name,
        lm.content AS last_message_content,
        lm.created_at AS last_message_time,
        lm.role AS last_message_role
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      JOIN channels ch ON ch.id = c.channel_id
      LEFT JOIN users u ON u.id = c.assigned_user_id
      LEFT JOIN LATERAL (
        SELECT content, created_at, role
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.role IN ('parent', 'agent', 'internal_note')
          AND m.source IN ('human', 'system')
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE c.school_id = ${schoolId}
        AND (ct.full_name ILIKE ${searchPattern} OR ct.phone ILIKE ${searchPattern} OR c.topic ILIKE ${searchPattern})
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    query = sql`
      SELECT 
        c.id, c.school_id, c.contact_id, c.channel_id, c.assigned_user_id,
        c.topic, c.status, c.priority, c.created_at, c.updated_at,
        ct.full_name AS contact_name, ct.phone AS contact_phone,
        ct.contact_type, ct.lead_temp, ct.edu_level,
        ch.name AS channel_name, ch.type AS channel_type,
        u.display_name AS assigned_name,
        lm.content AS last_message_content,
        lm.created_at AS last_message_time,
        lm.role AS last_message_role
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      JOIN channels ch ON ch.id = c.channel_id
      LEFT JOIN users u ON u.id = c.assigned_user_id
      LEFT JOIN LATERAL (
        SELECT content, created_at, role
        FROM messages m
        WHERE m.conversation_id = c.id
          AND m.role IN ('parent', 'agent', 'internal_note')
          AND m.source IN ('human', 'system')
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE c.school_id = ${schoolId}
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const rows = await query;
  return rows as ConversationListItem[];
}

export async function getConversationDetail(id: number | string) {
  const rows = (await sql`
    SELECT 
      c.*,
      ct.full_name AS contact_name,
      ct.phone AS contact_phone,
      ct.email AS contact_email,
      ct.contact_type,
      ct.lead_temp,
      ct.edu_level,
      ct.internal_notes AS contact_notes,
      ch.name AS channel_name,
      ch.type AS channel_type,
      u.display_name AS assigned_name,
      u.avatar_url AS assigned_avatar
    FROM conversations c
    JOIN contacts ct ON ct.id = c.contact_id
    JOIN channels ch ON ch.id = c.channel_id
    LEFT JOIN users u ON u.id = c.assigned_user_id
    WHERE c.id = ${id}
    LIMIT 1
  `) as any[];

  if (rows.length === 0) return null;
  const conversation = rows[0];

  // Fetch linked students
  const students = (await sql`
    SELECT s.*, ar.id AS admission_id, ar.stage AS admission_stage, ar.academic_year
    FROM students s
    LEFT JOIN admission_records ar ON ar.student_id = s.id AND ar.is_active = TRUE
    WHERE s.contact_id = ${conversation.contact_id}
    ORDER BY s.id ASC
  `) as any[];

  return {
    ...conversation,
    students,
  };
}

export async function updateConversationStatus(
  id: number | string,
  status: string
): Promise<void> {
  await sql`
    UPDATE conversations
    SET status = ${status},
        closed_at = ${status === 'closed' ? sql`NOW()` : null},
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateConversationPriority(
  id: number | string,
  priority: string
): Promise<void> {
  await sql`
    UPDATE conversations
    SET priority = ${priority}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateConversationAssignee(
  id: number | string,
  userId: number | string | null
): Promise<void> {
  await sql`
    UPDATE conversations
    SET assigned_user_id = ${userId}, updated_at = NOW()
    WHERE id = ${id}
  `;
}
