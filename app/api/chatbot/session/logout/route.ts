import { NextRequest, NextResponse } from 'next/server';
import { closeSessionByToken } from '@/lib/queries/chatbot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await closeSessionByToken(token);

    return NextResponse.json({
      success: true,
      message: 'Sesi berhasil diakhiri',
    });
  } catch (error: any) {
    console.error('Error in session logout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
