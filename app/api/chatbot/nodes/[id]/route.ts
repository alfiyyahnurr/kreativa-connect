import { NextRequest, NextResponse } from 'next/server';
import { 
  getNodeWithOptions, 
  saveChatbotMessage, 
  updateSessionCurrentNode 
} from '@/lib/queries/chatbot';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const node = await getNodeWithOptions(id);
    if (!node) {
      return NextResponse.json({ error: 'Node tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ node });
  } catch (error: any) {
    console.error('Error fetching node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { sessionId, optionId, optionLabel } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // 1. Record user's choice
    if (optionLabel) {
      await saveChatbotMessage({
        sessionId,
        flowNodeId: id,
        flowOptionId: optionId || null,
        role: 'user',
        source: 'flow',
        content: optionLabel,
      });
    }

    // 2. Fetch the target next node
    const nextNode = await getNodeWithOptions(id);
    if (!nextNode) {
      return NextResponse.json({ error: 'Target node not found' }, { status: 404 });
    }

    // 3. Update session
    await updateSessionCurrentNode(sessionId, nextNode.id);

    // 4. Record bot's reply message
    await saveChatbotMessage({
      sessionId,
      flowNodeId: nextNode.id,
      role: 'bot',
      source: 'flow',
      content: nextNode.message_text,
    });

    return NextResponse.json({
      success: true,
      nextNode,
    });
  } catch (error: any) {
    console.error('Error selecting node option:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
