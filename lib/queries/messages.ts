import { sql } from '@/lib/db/neon';

export interface MessageItem {
  id: string;
  conversation_id: string;
  sent_by_user_id: string | null;
  role: 'parent' | 'agent' | 'bot' | 'internal_note';
  source: 'human' | 'ai' | 'system';
  content: string;
  is_visible_to_parent: boolean;
  created_at: string;
  sender_name?: string | null;
  sender_avatar?: string | null;
}

export async function getConversationMessages(
  conversationId: number | string,
  includeInternalNotes: boolean = true
): Promise<MessageItem[]> {
  let query;
  if (includeInternalNotes) {
    query = sql`
      SELECT 
        m.id, m.conversation_id, m.sent_by_user_id, m.role, m.source,
        m.content, m.is_visible_to_parent, m.created_at,
        u.display_name AS sender_name,
        u.avatar_url AS sender_avatar
      FROM messages m
      LEFT JOIN users u ON u.id = m.sent_by_user_id
      WHERE m.conversation_id = ${conversationId}
      ORDER BY m.created_at ASC, m.id ASC
    `;
  } else {
    query = sql`
      SELECT 
        m.id, m.conversation_id, m.sent_by_user_id, m.role, m.source,
        m.content, m.is_visible_to_parent, m.created_at,
        u.display_name AS sender_name,
        u.avatar_url AS sender_avatar
      FROM messages m
      LEFT JOIN users u ON u.id = m.sent_by_user_id
      WHERE m.conversation_id = ${conversationId}
        AND m.is_visible_to_parent = TRUE
      ORDER BY m.created_at ASC, m.id ASC
    `;
  }

  const rows = await query;
  return rows as MessageItem[];
}

export async function createMessage(data: {
  conversationId: number | string;
  sentByUserId?: number | string | null;
  role: 'parent' | 'agent' | 'bot' | 'internal_note';
  source?: 'human' | 'ai' | 'system';
  content: string;
  isVisibleToParent?: boolean;
}): Promise<MessageItem> {
  const isVisible = data.isVisibleToParent !== undefined 
    ? data.isVisibleToParent 
    : data.role !== 'internal_note';

  const rows = (await sql`
    INSERT INTO messages (
      conversation_id, sent_by_user_id, role, source, content, is_visible_to_parent
    ) VALUES (
      ${data.conversationId},
      ${data.sentByUserId || null},
      ${data.role},
      ${data.source || 'human'},
      ${data.content},
      ${isVisible}
    )
    RETURNING *
  `) as MessageItem[];

  // Update conversation updated_at
  await sql`
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = ${data.conversationId}
  `;

  return rows[0];
}

export async function createAgentMessage(
  conversationId: number | string,
  userId: number | string,
  content: string
): Promise<MessageItem> {
  return createMessage({
    conversationId,
    sentByUserId: userId,
    role: 'agent',
    source: 'human',
    content,
    isVisibleToParent: true,
  });
}

export async function createInternalNote(
  conversationId: number | string,
  userId: number | string,
  content: string
): Promise<MessageItem> {
  return createMessage({
    conversationId,
    sentByUserId: userId,
    role: 'internal_note',
    source: 'human',
    content,
    isVisibleToParent: false,
  });
}
