import { sql } from '@/lib/db/neon';

export interface OverviewMetrics {
  totalConversations: number;
  openNewCount: number;
  pendingCount: number;
  closedCount: number;
  overdueTasksCount: number;
  slaPercent: number;
  slaTargetMinutes: number;
  levelBreakdown: { level: string; count: number; percentage: number }[];
  recentAttentionChats: {
    id: string;
    contactName: string;
    topic: string;
    assignedName: string;
    level: string;
    status: string;
    updatedAt: string;
  }[];
}

export async function getOverviewMetrics(schoolId: number | string = 1): Promise<OverviewMetrics> {
  // 1. Conversation stats
  const convStats = (await sql`
    SELECT 
      COUNT(*)::int AS total_conversations,
      COUNT(CASE WHEN status = 'new' THEN 1 END)::int AS open_new,
      COUNT(CASE WHEN status NOT IN ('closed') THEN 1 END)::int AS pending_count,
      COUNT(CASE WHEN status = 'closed' THEN 1 END)::int AS closed_count
    FROM conversations
    WHERE school_id = ${schoolId}
  `) as any[];

  const stat = convStats[0] || {
    total_conversations: 0,
    open_new: 0,
    pending_count: 0,
    closed_count: 0,
  };

  // 2. Overdue tasks
  const overdueRow = (await sql`
    SELECT COUNT(*)::int AS overdue_count
    FROM tasks
    WHERE school_id = ${schoolId}
      AND is_done = FALSE
      AND due_at < NOW()
  `) as any[];
  const overdueTasksCount = overdueRow[0]?.overdue_count || 0;

  // 3. Settings for SLA target
  const settingsRow = (await sql`
    SELECT sla_target_minutes FROM settings WHERE school_id = ${schoolId} LIMIT 1
  `) as any[];
  const slaTargetMinutes = settingsRow[0]?.sla_target_minutes || 15;

  // 4. SLA calculation
  const slaStats = (await sql`
    SELECT 
      COUNT(*)::int AS with_response,
      COUNT(CASE WHEN first_response_secs <= (${slaTargetMinutes} * 60) THEN 1 END)::int AS on_time
    FROM conversations
    WHERE school_id = ${schoolId}
      AND first_response_secs IS NOT NULL
  `) as any[];

  const withResponse = slaStats[0]?.with_response || 0;
  const onTime = slaStats[0]?.on_time || 0;
  const slaPercent = withResponse > 0 ? Math.round((onTime / withResponse) * 100) : 85;

  // 5. Level breakdown
  const levelRows = (await sql`
    SELECT 
      COALESCE(ct.edu_level, 'general') AS level,
      COUNT(c.id)::int AS count
    FROM conversations c
    JOIN contacts ct ON ct.id = c.contact_id
    WHERE c.school_id = ${schoolId}
    GROUP BY ct.edu_level
    ORDER BY count DESC
  `) as any[];

  const totalConv = stat.total_conversations || 1;
  const levelBreakdown = levelRows.map((r: any) => ({
    level: r.level,
    count: r.count,
    percentage: Math.round((r.count / totalConv) * 100),
  }));

  // 6. Recent attention chats
  const recentRows = (await sql`
    SELECT 
      c.id, c.topic, c.status, c.updated_at,
      ct.full_name AS contact_name,
      COALESCE(ct.edu_level, '—') AS level,
      COALESCE(u.display_name, 'Unassigned') AS assigned_name
    FROM conversations c
    JOIN contacts ct ON ct.id = c.contact_id
    LEFT JOIN users u ON u.id = c.assigned_user_id
    WHERE c.school_id = ${schoolId}
      AND c.status NOT IN ('closed')
    ORDER BY c.updated_at DESC
    LIMIT 5
  `) as any[];

  const recentAttentionChats = recentRows.map((r: any) => ({
    id: r.id,
    contactName: r.contact_name,
    topic: r.topic || 'Inquiry',
    assignedName: r.assigned_name,
    level: r.level,
    status: r.status,
    updatedAt: r.updated_at,
  }));

  return {
    totalConversations: stat.total_conversations,
    openNewCount: stat.open_new,
    pendingCount: stat.pending_count,
    closedCount: stat.closed_count,
    overdueTasksCount,
    slaPercent,
    slaTargetMinutes,
    levelBreakdown,
    recentAttentionChats,
  };
}

export async function getReportsMetrics(schoolId: number | string = 1) {
  // Volume per channel
  const channelsVolume = await sql`
    SELECT 
      ch.name AS channel_name,
      ch.type AS channel_type,
      COUNT(c.id)::int AS count
    FROM channels ch
    LEFT JOIN conversations c ON c.channel_id = ch.id
    WHERE ch.school_id = ${schoolId}
    GROUP BY ch.id, ch.name, ch.type
    ORDER BY count DESC
  `;

  // Workload per team/user
  const teamWorkload = await sql`
    SELECT 
      u.display_name AS user_name,
      u.role,
      COUNT(c.id)::int AS total_assigned,
      COUNT(CASE WHEN c.status = 'closed' THEN 1 END)::int AS completed_count,
      COUNT(CASE WHEN c.status != 'closed' THEN 1 END)::int AS active_count
    FROM users u
    LEFT JOIN conversations c ON c.assigned_user_id = u.id
    WHERE u.school_id = ${schoolId} AND u.is_active = TRUE
    GROUP BY u.id, u.display_name, u.role
    ORDER BY total_assigned DESC
  `;

  // Admission funnel counts
  const admissionFunnel = await sql`
    SELECT 
      stage,
      COUNT(*)::int AS count
    FROM admission_records
    WHERE school_id = ${schoolId} AND is_active = TRUE
    GROUP BY stage
    ORDER BY count DESC
  `;

  return {
    channelsVolume,
    teamWorkload,
    admissionFunnel,
  };
}
