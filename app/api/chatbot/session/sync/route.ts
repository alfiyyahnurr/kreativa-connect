import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, getLatestAgentMessages } from '@/lib/queries/chatbot';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    const afterId = req.nextUrl.searchParams.get('afterId');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const isEscalated = session.status === 'handed_over' && !!session.conversation_id;

    if (isEscalated && session.conversation_id) {
      const newMessages = await getLatestAgentMessages(session.conversation_id, afterId || undefined);
      return NextResponse.json({
        success: true,
        isEscalated: true,
        conversationId: session.conversation_id,
        messages: newMessages,
      });
    }

    return NextResponse.json({
      success: true,
      isEscalated: false,
      messages: [],
    });
  } catch (error: any) {
    console.error('Error in chatbot session sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
