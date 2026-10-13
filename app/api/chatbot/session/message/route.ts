import { NextRequest, NextResponse } from 'next/server';
import { getSessionByToken, sendParentMessageToCrm } from '@/lib/queries/chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, content } = body;

    if (!token || !content?.trim()) {
      return NextResponse.json({ error: 'Token dan konten pesan wajib diisi' }, { status: 400 });
    }

    const session = await getSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    const savedMsg = await sendParentMessageToCrm(session.id, content.trim());

    return NextResponse.json({
      success: true,
      message: savedMsg,
    });
  } catch (error: any) {
    console.error('Error sending parent message to CRM:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
