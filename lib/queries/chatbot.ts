import { sql } from '@/lib/db/neon';

export interface ChatbotFlowNode {
  id: string;
  school_id: string;
  faq_id: string | null;
  fee_structure_id: string | null;
  is_root: boolean;
  node_type: string;
  message_text: string;
  ai_fallback_text: string | null;
  handover_team: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ChatbotFlowOption {
  id: string;
  node_id: string;
  next_node_id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface ChatbotNodeWithOptions extends ChatbotFlowNode {
  options: ChatbotFlowOption[];
}

export interface ChatbotSession {
  id: string;
  school_id: string;
  contact_id: string | null;
  conversation_id: string | null;
  session_token: string;
  status: string;
  current_node_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatbotMessage {
  id: string;
  session_id: string;
  flow_node_id: string | null;
  flow_option_id: string | null;
  role: 'bot' | 'user';
  source: 'flow' | 'faq' | 'ai' | 'system';
  content: string;
  ai_tokens_used: number | null;
  created_at: string;
}

export async function getRootNode(schoolId: number | string): Promise<ChatbotNodeWithOptions | null> {
  const nodes = (await sql`
    SELECT * FROM chatbot_flow_nodes
    WHERE school_id = ${schoolId} AND is_root = TRUE AND is_active = TRUE
    LIMIT 1
  `) as ChatbotFlowNode[];

  if (nodes.length === 0) return null;
  const rootNode = nodes[0];

  const options = (await sql`
    SELECT * FROM chatbot_flow_options
    WHERE node_id = ${rootNode.id} AND is_active = TRUE
    ORDER BY sort_order ASC, id ASC
  `) as ChatbotFlowOption[];

  return {
    ...rootNode,
    options,
  };
}

export async function getNodeWithOptions(nodeId: number | string): Promise<ChatbotNodeWithOptions | null> {
  const nodes = (await sql`
    SELECT * FROM chatbot_flow_nodes
    WHERE id = ${nodeId} AND is_active = TRUE
    LIMIT 1
  `) as ChatbotFlowNode[];

  if (nodes.length === 0) return null;
  const node = nodes[0];

  const options = (await sql`
    SELECT * FROM chatbot_flow_options
    WHERE node_id = ${node.id} AND is_active = TRUE
    ORDER BY sort_order ASC, id ASC
  `) as ChatbotFlowOption[];

  return {
    ...node,
    options,
  };
}

export async function createChatbotSession(data: {
  schoolId: number | string;
  parentName: string;
  parentPhone: string;
  isParent?: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<ChatbotSession> {
  const sessionToken = 'csess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  // 1. Find or create contact
  const cleanPhone = data.parentPhone.replace(/[^0-9+]/g, '');
  const existingContacts = (await sql`
    SELECT id FROM contacts
    WHERE school_id = ${data.schoolId} AND phone = ${cleanPhone}
    LIMIT 1
  `) as { id: string }[];

  let contactId: string;
  if (existingContacts.length > 0) {
    contactId = existingContacts[0].id;
  } else {
    const newContacts = (await sql`
      INSERT INTO contacts (
        school_id, full_name, phone, contact_type, lead_temp, internal_notes
      ) VALUES (
        ${data.schoolId},
        ${data.parentName},
        ${cleanPhone},
        ${data.isParent ? 'active_parent' : 'prospective'},
        'warm',
        'Contacted via Web Live Chat Widget'
      )
      RETURNING id
    `) as { id: string }[];
    contactId = newContacts[0].id;
  }

  // 1b. Check if this contact has an existing active or handed_over session (Session Resumption)
  const existingSessions = (await sql`
    SELECT * FROM chatbot_sessions
    WHERE school_id = ${data.schoolId}
      AND contact_id = ${contactId}
      AND status IN ('active', 'handed_over')
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `) as ChatbotSession[];

  if (existingSessions.length > 0) {
    const existing = existingSessions[0];
    await sql`
      UPDATE chatbot_sessions
      SET parent_name = ${data.parentName},
          user_agent = ${data.userAgent || null},
          updated_at = NOW()
      WHERE id = ${existing.id}
    `;
    return {
      ...existing,
      parent_name: data.parentName,
    };
  }

  // 2. Find root node
  const rootNode = await getRootNode(data.schoolId);

  // 3. Create session
  const sessions = (await sql`
    INSERT INTO chatbot_sessions (
      school_id, contact_id, session_token, status, current_node_id,
      parent_name, parent_phone, user_agent
    ) VALUES (
      ${data.schoolId},
      ${contactId},
      ${sessionToken},
      'active',
      ${rootNode ? rootNode.id : null},
      ${data.parentName},
      ${cleanPhone},
      ${data.userAgent || null}
    )
    RETURNING *
  `) as ChatbotSession[];

  const session = sessions[0];

  // If root node exists, record initial greeting as first bot message
  if (rootNode) {
    await saveChatbotMessage({
      sessionId: session.id,
      flowNodeId: rootNode.id,
      role: 'bot',
      source: 'flow',
      content: rootNode.message_text,
    });
  }

  return session;
}

export async function getSessionByToken(sessionToken: string): Promise<ChatbotSession | null> {
  const rows = (await sql`
    SELECT * FROM chatbot_sessions
    WHERE session_token = ${sessionToken}
    LIMIT 1
  `) as ChatbotSession[];
  return rows[0] || null;
}

export async function updateSessionCurrentNode(
  sessionId: number | string,
  nodeId: number | string
): Promise<void> {
  if (String(nodeId) === '1') {
    await sql`
      UPDATE chatbot_sessions
      SET current_node_id = ${nodeId}, status = 'active', conversation_id = NULL, updated_at = NOW()
      WHERE id = ${sessionId}
    `;
  } else {
    await sql`
      UPDATE chatbot_sessions
      SET current_node_id = ${nodeId}, updated_at = NOW()
      WHERE id = ${sessionId}
    `;
  }
}

export async function saveChatbotMessage(data: {
  sessionId: number | string;
  flowNodeId?: number | string | null;
  flowOptionId?: number | string | null;
  role: 'bot' | 'user';
  source: 'flow' | 'faq' | 'ai' | 'system';
  content: string;
  aiTokensUsed?: number;
}): Promise<ChatbotMessage> {
  const rows = (await sql`
    INSERT INTO chatbot_messages (
      session_id, flow_node_id, flow_option_id, role, source, content, ai_tokens_used
    ) VALUES (
      ${data.sessionId},
      ${data.flowNodeId || null},
      ${data.flowOptionId || null},
      ${data.role},
      ${data.source},
      ${data.content},
      ${data.aiTokensUsed || null}
    )
    RETURNING *
  `) as ChatbotMessage[];
  const saved = rows[0];

  return saved;
}

export async function getSessionMessages(sessionId: number | string): Promise<ChatbotMessage[]> {
  const rows = (await sql`
    SELECT * FROM chatbot_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC, id ASC
  `) as ChatbotMessage[];
  return rows;
}

export async function escalateToCrmConversation(
  sessionId: number | string,
  schoolId: number | string,
  teamName: string = 'Admission'
): Promise<string> {
  // 1. Get session
  const sessionRows = (await sql`
    SELECT * FROM chatbot_sessions WHERE id = ${sessionId} LIMIT 1
  `) as ChatbotSession[];
  if (sessionRows.length === 0) throw new Error('Session not found');
  const session = sessionRows[0];

  if (session.conversation_id) {
    return session.conversation_id;
  }

  // 2. Find web_chat channel for this school
  const channelRows = (await sql`
    SELECT id FROM channels
    WHERE school_id = ${schoolId} AND type = 'web_chat'
    LIMIT 1
  `) as { id: string }[];
  const channelId = channelRows.length > 0 ? channelRows[0].id : 1;

  // 3. Create conversation in CRM
  const convRows = (await sql`
    INSERT INTO conversations (
      school_id, contact_id, channel_id, chatbot_session_id,
      topic, status, priority
    ) VALUES (
      ${schoolId},
      ${session.contact_id},
      ${channelId},
      ${sessionId},
      ${'Live Chat - Eskalasi ' + teamName},
      'new',
      'high'
    )
    RETURNING id
  `) as { id: string }[];
  const conversationId = convRows[0].id;

  // 4. Update session
  await sql`
    UPDATE chatbot_sessions
    SET status = 'handed_over', conversation_id = ${conversationId}, updated_at = NOW()
    WHERE id = ${sessionId}
  `;

  // 5. System handover alert note (clean notification for staff)
  const parentLabel = session.parent_name ? `${session.parent_name} (${session.parent_phone || 'WhatsApp'})` : 'Orang Tua';
  await sql`
    INSERT INTO messages (
      conversation_id, role, source, content, is_visible_to_parent
    ) VALUES (
      ${conversationId},
      'internal_note',
      'system',
      ${`🟢 Parent ${parentLabel} telah terhubung ke Tim ${teamName}. Siap melayani konsultasi langsung.`},
      FALSE
    )
  `;

  return conversationId;
}

export interface FormattedSessionMessage {
  id: string;
  role: 'bot' | 'user' | 'agent';
  source: string;
  content: string;
  senderName?: string;
  createdAt: string;
}

export interface ChatSessionDetails {
  session: ChatbotSession;
  contactName: string;
  contactPhone: string;
  isEscalated: boolean;
  conversationId: string | null;
  currentNode: ChatbotNodeWithOptions | null;
  messages: FormattedSessionMessage[];
}

export async function getSessionDetailsByToken(
  sessionToken: string
): Promise<ChatSessionDetails | null> {
  const session = await getSessionByToken(sessionToken);
  if (!session) return null;

  const isEscalated = session.status === 'handed_over' && !!session.conversation_id;
  let formattedMessages: FormattedSessionMessage[] = [];

  // Ambil seluruh pesan sesi (interaksi flow, AI, dan chat orang tua) dari chatbot_messages
  const botMsgs = await getSessionMessages(session.id);
  const formattedBotMsgs: FormattedSessionMessage[] = botMsgs.map((m) => ({
    id: `bot_${m.id}`,
    role: m.role === 'bot' ? 'bot' : 'user',
    source: m.source,
    content: m.content,
    createdAt: m.created_at,
  }));

  let formattedAgentMsgs: FormattedSessionMessage[] = [];
  if (session.conversation_id) {
    // Ambil hanya balasan resmi dari Tim Admission/Staff (role = 'agent')
    const agentMsgs = (await sql`
      SELECT 
        m.id,
        m.conversation_id,
        m.role,
        m.source,
        m.content,
        m.created_at,
        u.display_name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sent_by_user_id
      WHERE m.conversation_id = ${session.conversation_id}
        AND m.role = 'agent'
        AND m.is_visible_to_parent = TRUE
      ORDER BY m.created_at ASC, m.id ASC
    `) as Array<{
      id: string;
      conversation_id: string;
      role: string;
      source: string;
      content: string;
      created_at: string;
      sender_name: string | null;
    }>;

    formattedAgentMsgs = agentMsgs.map((m) => ({
      id: `agent_${m.id}`,
      role: 'agent',
      source: m.source,
      content: m.content,
      senderName: m.sender_name || 'Tim Admission',
      createdAt: m.created_at,
    }));
  }

  // Gabungkan dan urutkan sesuai kronologi waktu
  formattedMessages = [...formattedBotMsgs, ...formattedAgentMsgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  let currentNode: ChatbotNodeWithOptions | null = null;
  if (session.current_node_id) {
    currentNode = await getNodeWithOptions(session.current_node_id);
  }

  return {
    session,
    contactName: session.parent_name || '',
    contactPhone: session.parent_phone || '',
    isEscalated,
    conversationId: session.conversation_id,
    currentNode,
    messages: formattedMessages,
  };
}

export async function getLatestAgentMessages(
  conversationId: number | string,
  afterId?: number | string
): Promise<FormattedSessionMessage[]> {
  let query;
  if (afterId && !isNaN(Number(afterId))) {
    query = sql`
      SELECT 
        m.id,
        m.conversation_id,
        m.role,
        m.source,
        m.content,
        m.created_at,
        u.display_name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sent_by_user_id
      WHERE m.conversation_id = ${conversationId}
        AND m.is_visible_to_parent = TRUE
        AND m.id > ${afterId}
      ORDER BY m.created_at ASC, m.id ASC
    `;
  } else {
    query = sql`
      SELECT 
        m.id,
        m.conversation_id,
        m.role,
        m.source,
        m.content,
        m.created_at,
        u.display_name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sent_by_user_id
      WHERE m.conversation_id = ${conversationId}
        AND m.is_visible_to_parent = TRUE
      ORDER BY m.created_at ASC, m.id ASC
    `;
  }

  const rows = (await query) as Array<{
    id: string;
    conversation_id: string;
    role: string;
    source: string;
    content: string;
    created_at: string;
    sender_name: string | null;
  }>;

  return rows.map((m) => {
    let mappedRole: 'bot' | 'user' | 'agent' = 'bot';
    if (m.role === 'parent') mappedRole = 'user';
    else if (m.role === 'agent') mappedRole = 'agent';
    else if (m.role === 'bot') mappedRole = 'bot';

    return {
      id: String(m.id),
      role: mappedRole,
      source: m.source,
      content: m.content,
      senderName: m.role === 'agent' ? (m.sender_name || 'Tim Admission') : undefined,
      createdAt: m.created_at,
    };
  });
}

export async function sendParentMessageToCrm(
  sessionId: number | string,
  content: string
): Promise<FormattedSessionMessage | null> {
  const sessionRows = (await sql`
    SELECT * FROM chatbot_sessions WHERE id = ${sessionId} LIMIT 1
  `) as ChatbotSession[];
  if (sessionRows.length === 0) return null;
  const session = sessionRows[0];

  if (!session.conversation_id) {
    const saved = await saveChatbotMessage({
      sessionId,
      role: 'user',
      source: 'ai',
      content,
    });
    return {
      id: String(saved.id),
      role: 'user',
      source: saved.source,
      content: saved.content,
      createdAt: saved.created_at,
    };
  }

  const msgRows = (await sql`
    INSERT INTO messages (
      conversation_id, role, source, content, is_visible_to_parent, created_at
    ) VALUES (
      ${session.conversation_id}, 'parent', 'human', ${content}, TRUE, NOW()
    )
    RETURNING *
  `) as Array<{
    id: string;
    conversation_id: string;
    role: string;
    source: string;
    content: string;
    created_at: string;
  }>;

  // Audit to chatbot_messages as well
  await saveChatbotMessage({
    sessionId,
    role: 'user',
    source: 'ai',
    content,
  });

  // Update conversation timestamp for CRM Inbox sorting
  await sql`
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = ${session.conversation_id}
  `;

  const row = msgRows[0];
  return {
    id: String(row.id),
    role: 'user',
    source: row.source,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function closeSessionByToken(sessionToken: string): Promise<boolean> {
  const res = await sql`
    UPDATE chatbot_sessions
    SET status = 'closed', updated_at = NOW()
    WHERE session_token = ${sessionToken}
    RETURNING id
  `;
  return res.length > 0;
}

