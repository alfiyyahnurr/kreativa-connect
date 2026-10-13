import { sql } from '@/lib/db/neon';

export interface SchoolSettings {
  id: string;
  school_id: string;
  operating_start: string;
  operating_end: string;
  operating_days: string;
  sla_target_minutes: number;
  alert_overdue_tasks: boolean;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  ai_provider: string;
  ai_model: string;
  ai_system_prompt: string | null;
  ai_context_messages: number;
  created_at: string;
  updated_at: string;
}

export async function getSchoolSettings(schoolId: number | string = 1): Promise<SchoolSettings | null> {
  const rows = (await sql`
    SELECT * FROM settings
    WHERE school_id = ${schoolId}
    LIMIT 1
  `) as SchoolSettings[];
  return rows[0] || null;
}

export async function updateSchoolSettings(
  schoolId: number | string,
  data: Partial<{
    operating_start: string;
    operating_end: string;
    operating_days: string;
    sla_target_minutes: number;
    alert_overdue_tasks: boolean;
    auto_reply_enabled: boolean;
    auto_reply_message: string | null;
    ai_system_prompt: string | null;
    ai_context_messages: number;
  }>
): Promise<void> {
  await sql`
    UPDATE settings
    SET 
      operating_start = COALESCE(${data.operating_start || null}, operating_start),
      operating_end = COALESCE(${data.operating_end || null}, operating_end),
      operating_days = COALESCE(${data.operating_days || null}, operating_days),
      sla_target_minutes = COALESCE(${data.sla_target_minutes !== undefined ? data.sla_target_minutes : null}, sla_target_minutes),
      alert_overdue_tasks = COALESCE(${data.alert_overdue_tasks !== undefined ? data.alert_overdue_tasks : null}, alert_overdue_tasks),
      auto_reply_enabled = COALESCE(${data.auto_reply_enabled !== undefined ? data.auto_reply_enabled : null}, auto_reply_enabled),
      auto_reply_message = COALESCE(${data.auto_reply_message !== undefined ? data.auto_reply_message : null}, auto_reply_message),
      ai_system_prompt = COALESCE(${data.ai_system_prompt !== undefined ? data.ai_system_prompt : null}, ai_system_prompt),
      ai_context_messages = COALESCE(${data.ai_context_messages !== undefined ? data.ai_context_messages : null}, ai_context_messages),
      updated_at = NOW()
    WHERE school_id = ${schoolId}
  `;
}
