import { sql } from '@/lib/db/neon';

export interface TaskItem {
  id: string;
  school_id: string;
  contact_id: string;
  conversation_id: string | null;
  assigned_user_id: string | null;
  title: string;
  due_at: string;
  is_done: boolean;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  contact_name: string;
  contact_phone: string;
  assigned_name: string | null;
  is_overdue: boolean;
}

export async function getTasksList(options?: {
  schoolId?: number | string;
  isDone?: boolean;
  assignedUserId?: number | string;
}): Promise<TaskItem[]> {
  const schoolId = options?.schoolId || 1;

  let query;
  if (options?.isDone !== undefined) {
    query = sql`
      SELECT 
        t.*,
        c.full_name AS contact_name,
        c.phone AS contact_phone,
        u.display_name AS assigned_name,
        (t.due_at < NOW() AND t.is_done = FALSE) AS is_overdue
      FROM tasks t
      JOIN contacts c ON c.id = t.contact_id
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.school_id = ${schoolId}
        AND t.is_done = ${options.isDone}
      ORDER BY t.due_at ASC
    `;
  } else {
    query = sql`
      SELECT 
        t.*,
        c.full_name AS contact_name,
        c.phone AS contact_phone,
        u.display_name AS assigned_name,
        (t.due_at < NOW() AND t.is_done = FALSE) AS is_overdue
      FROM tasks t
      JOIN contacts c ON c.id = t.contact_id
      LEFT JOIN users u ON u.id = t.assigned_user_id
      WHERE t.school_id = ${schoolId}
      ORDER BY t.is_done ASC, t.due_at ASC
    `;
  }

  const rows = await query;
  return rows as TaskItem[];
}

export async function getOverdueTasksCount(schoolId: number | string = 1): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM tasks
    WHERE school_id = ${schoolId}
      AND is_done = FALSE
      AND due_at < NOW()
  `) as { count: number }[];
  return rows[0]?.count || 0;
}

export async function createTask(data: {
  schoolId: number | string;
  contactId: number | string;
  conversationId?: number | string | null;
  assignedUserId?: number | string | null;
  title: string;
  dueAt: string;
}): Promise<TaskItem> {
  const rows = (await sql`
    INSERT INTO tasks (
      school_id, contact_id, conversation_id, assigned_user_id, title, due_at
    ) VALUES (
      ${data.schoolId},
      ${data.contactId},
      ${data.conversationId || null},
      ${data.assignedUserId || null},
      ${data.title},
      ${data.dueAt}
    )
    RETURNING *
  `) as any[];
  return rows[0];
}

export async function toggleTaskDone(id: number | string, isDone: boolean): Promise<void> {
  await sql`
    UPDATE tasks
    SET 
      is_done = ${isDone},
      done_at = ${isDone ? sql`NOW()` : null},
      updated_at = NOW()
    WHERE id = ${id}
  `;
}
