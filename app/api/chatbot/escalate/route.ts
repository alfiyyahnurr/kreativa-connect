import { NextRequest, NextResponse } from 'next/server';
import { escalateToCrmConversation } from '@/lib/queries/chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, schoolId = 1, teamName = 'Admission' } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const conversationId = await escalateToCrmConversation(sessionId, schoolId, teamName);

    return NextResponse.json({
      success: true,
      conversationId,
      message: `Percakapan dialihkan ke tim ${teamName}. Tim kami akan segera merespons Anda.`,
    });
  } catch (error: any) {
    console.error('Error escalating chatbot session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
