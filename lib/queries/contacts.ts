import { sql } from '@/lib/db/neon';

export interface ContactItem {
  id: string;
  school_id: string;
  assigned_user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  contact_type: string;
  lead_temp: string | null;
  edu_level: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_name?: string | null;
  students_count?: number;
}

export interface ContactFilter {
  schoolId?: number | string;
  contactType?: string;
  leadTemp?: string;
  eduLevel?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getContactsList(filter: ContactFilter = {}): Promise<ContactItem[]> {
  const schoolId = filter.schoolId || 1;
  const limit = filter.limit || 50;
  const offset = filter.offset || 0;

  let query;

  if (filter.search) {
    const searchPattern = `%${filter.search}%`;
    query = sql`
      SELECT 
        c.*,
        u.display_name AS assigned_name,
        (SELECT COUNT(*)::int FROM students s WHERE s.contact_id = c.id) AS students_count
      FROM contacts c
      LEFT JOIN users u ON u.id = c.assigned_user_id
      WHERE c.school_id = ${schoolId}
        AND (c.full_name ILIKE ${searchPattern} OR c.phone ILIKE ${searchPattern} OR c.email ILIKE ${searchPattern})
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (filter.contactType) {
    query = sql`
      SELECT 
        c.*,
        u.display_name AS assigned_name,
        (SELECT COUNT(*)::int FROM students s WHERE s.contact_id = c.id) AS students_count
      FROM contacts c
      LEFT JOIN users u ON u.id = c.assigned_user_id
      WHERE c.school_id = ${schoolId}
        AND c.contact_type = ${filter.contactType}
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    query = sql`
      SELECT 
        c.*,
        u.display_name AS assigned_name,
        (SELECT COUNT(*)::int FROM students s WHERE s.contact_id = c.id) AS students_count
      FROM contacts c
      LEFT JOIN users u ON u.id = c.assigned_user_id
      WHERE c.school_id = ${schoolId}
      ORDER BY c.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const rows = await query;
  return rows as ContactItem[];
}

export async function getContactById(id: number | string) {
  const rows = (await sql`
    SELECT 
      c.*,
      u.display_name AS assigned_name
    FROM contacts c
    LEFT JOIN users u ON u.id = c.assigned_user_id
    WHERE c.id = ${id}
    LIMIT 1
  `) as any[];

  if (rows.length === 0) return null;
  const contact = rows[0];

  const students = (await sql`
    SELECT s.*, ar.id AS admission_id, ar.stage AS admission_stage, ar.academic_year
    FROM students s
    LEFT JOIN admission_records ar ON ar.student_id = s.id AND ar.is_active = TRUE
    WHERE s.contact_id = ${id}
    ORDER BY s.id ASC
  `) as any[];

  const conversations = (await sql`
    SELECT 
      c.*,
      ch.name AS channel_name,
      ch.type AS channel_type
    FROM conversations c
    JOIN channels ch ON ch.id = c.channel_id
    WHERE c.contact_id = ${id}
    ORDER BY c.updated_at DESC
  `) as any[];

  const tasks = (await sql`
    SELECT * FROM tasks
    WHERE contact_id = ${id}
    ORDER BY due_at ASC
  `) as any[];

  return {
    ...contact,
    students,
    conversations,
    tasks,
  };
}

export async function createContact(data: {
  schoolId: number | string;
  fullName: string;
  phone: string;
  email?: string;
  contactType?: string;
  leadTemp?: string;
  eduLevel?: string;
  internalNotes?: string;
  assignedUserId?: number | string | null;
}): Promise<ContactItem> {
  const cleanPhone = data.phone.replace(/[^0-9+]/g, '');
  const rows = (await sql`
    INSERT INTO contacts (
      school_id, full_name, phone, email, contact_type,
      lead_temp, edu_level, internal_notes, assigned_user_id
    ) VALUES (
      ${data.schoolId},
      ${data.fullName},
      ${cleanPhone},
      ${data.email || null},
      ${data.contactType || 'prospective'},
      ${data.leadTemp || 'warm'},
      ${data.eduLevel || null},
      ${data.internalNotes || null},
      ${data.assignedUserId || null}
    )
    RETURNING *
  `) as ContactItem[];
  return rows[0];
}

export async function updateContact(
  id: number | string,
  data: Partial<{
    fullName: string;
    phone: string;
    email: string;
    contactType: string;
    leadTemp: string;
    eduLevel: string;
    internalNotes: string;
    assignedUserId: number | string | null;
  }>
): Promise<void> {
  await sql`
    UPDATE contacts
    SET 
      full_name = COALESCE(${data.fullName || null}, full_name),
      phone = COALESCE(${data.phone ? data.phone.replace(/[^0-9+]/g, '') : null}, phone),
      email = COALESCE(${data.email || null}, email),
      contact_type = COALESCE(${data.contactType || null}, contact_type),
      lead_temp = COALESCE(${data.leadTemp || null}, lead_temp),
      edu_level = COALESCE(${data.eduLevel || null}, edu_level),
      internal_notes = COALESCE(${data.internalNotes || null}, internal_notes),
      assigned_user_id = ${data.assignedUserId !== undefined ? data.assignedUserId : sql`assigned_user_id`},
      updated_at = NOW()
    WHERE id = ${id}
  `;
}
