import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages, createAgentMessage, createInternalNote } from '@/lib/queries/messages';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await getConversationMessages(id);
    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
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
    const { content, role = 'agent', userId = 1 } = body;

    if (!content) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    let message;
    if (role === 'internal_note') {
      message = await createInternalNote(id, userId, content);
    } else {
      message = await createAgentMessage(id, userId, content);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
