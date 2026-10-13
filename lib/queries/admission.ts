import { sql } from '@/lib/db/neon';

export interface AdmissionCardItem {
  id: string;
  school_id: string;
  student_id: string;
  contact_id: string;
  academic_year: string;
  stage: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  student_name: string;
  edu_level: string;
  student_number: string | null;
  parent_name: string;
  parent_phone: string;
  lead_temp: string | null;
  assigned_name: string | null;
}

export const ADMISSION_STAGES = [
  { id: 'registered', label: '1. Registered' },
  { id: 'assessment_scheduled', label: '2. Assessment Scheduled' },
  { id: 'assessment_completed', label: '3. Assessment Completed' },
  { id: 'parent_interview', label: '4. Parent Interview' },
  { id: 'selection_result', label: '5. Selection Result' },
  { id: 'accepted', label: '6. Accepted' },
  { id: 'confirmation_letter_pending', label: '7. Letter Pending' },
  { id: 'first_payment_pending', label: '8. Payment Pending' },
  { id: 'payment_verification', label: '9. Verifying Payment' },
  { id: 'enrollment_completed', label: '10. Enrolled' },
] as const;

export async function getAdmissionBoardRecords(schoolId: number | string): Promise<AdmissionCardItem[]> {
  const rows = (await sql`
    SELECT 
      ar.id, ar.school_id, ar.student_id, ar.contact_id, ar.academic_year,
      ar.stage, ar.is_active, ar.created_at, ar.updated_at,
      s.full_name AS student_name,
      s.edu_level,
      s.student_number,
      c.full_name AS parent_name,
      c.phone AS parent_phone,
      c.lead_temp,
      u.display_name AS assigned_name
    FROM admission_records ar
    JOIN students s ON s.id = ar.student_id
    JOIN contacts c ON c.id = ar.contact_id
    LEFT JOIN users u ON u.id = c.assigned_user_id
    WHERE ar.school_id = ${schoolId} AND ar.is_active = TRUE
    ORDER BY ar.updated_at DESC
  `) as AdmissionCardItem[];

  return rows;
}

export async function updateAdmissionStage(
  recordId: number | string,
  newStage: string,
  changedByUserId?: number | string | null,
  notes?: string
): Promise<void> {
  // Get current stage
  const curr = (await sql`
    SELECT stage FROM admission_records WHERE id = ${recordId} LIMIT 1
  `) as { stage: string }[];

  const previousStage = curr.length > 0 ? curr[0].stage : null;

  // Update stage
  await sql`
    UPDATE admission_records
    SET stage = ${newStage}, updated_at = NOW()
    WHERE id = ${recordId}
  `;

  // Insert log
  await sql`
    INSERT INTO admission_logs (
      admission_record_id, changed_by_user_id, previous_stage, new_stage, notes
    ) VALUES (
      ${recordId},
      ${changedByUserId || null},
      ${previousStage},
      ${newStage},
      ${notes || null}
    )
  `;
}

export async function getAdmissionLogs(recordId: number | string) {
  return await sql`
    SELECT 
      al.*,
      u.display_name AS changed_by_name
    FROM admission_logs al
    LEFT JOIN users u ON u.id = al.changed_by_user_id
    WHERE al.admission_record_id = ${recordId}
    ORDER BY al.created_at DESC
  `;
}
