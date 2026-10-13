import { NextRequest, NextResponse } from 'next/server';
import { 
  createChatbotSession, 
  getSessionDetailsByToken, 
  getRootNode, 
  getNodeWithOptions 
} from '@/lib/queries/chatbot';
import { checkRateLimit } from '@/lib/redis/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const isAllowed = await checkRateLimit(`ratelimit:intake:${ip}`, 20, '1 m');
    if (!isAllowed) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' }, { status: 429 });
    }

    const body = await req.json();
    const { schoolId = 1, parentName, parentPhone, isParent } = body;

    if (!parentName || !parentPhone) {
      return NextResponse.json({ error: 'Nama dan nomor WhatsApp wajib diisi.' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;

    const session = await createChatbotSession({
      schoolId,
      parentName,
      parentPhone,
      isParent: Boolean(isParent),
      userAgent,
    });

    // Ambil detail sesi lengkap (jika ini sesi lanjutan, kembalikan riwayat pesan sebelumnya)
    const details = await getSessionDetailsByToken(session.session_token);
    const rootNode = await getRootNode(schoolId);

    return NextResponse.json({
      success: true,
      session,
      initialNode: details?.currentNode || rootNode,
      rootNode,
      messages: details?.messages || [],
      isEscalated: details?.isEscalated || false,
      conversationId: details?.conversationId || null,
      isResumed: (details?.messages?.length || 0) > 1,
    });
  } catch (error: any) {
    console.error('Error creating chatbot session:', error);
    return NextResponse.json({ error: error.message || 'Gagal memulai sesi' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const details = await getSessionDetailsByToken(token);
    if (!details) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const rootNode = await getRootNode(details.session.school_id || 1);

    return NextResponse.json({
      success: true,
      session: details.session,
      currentNode: details.currentNode,
      rootNode,
      messages: details.messages,
      isEscalated: details.isEscalated,
      conversationId: details.conversationId,
      contactName: details.contactName,
      contactPhone: details.contactPhone,
    });
  } catch (error: any) {
    console.error('Error fetching chatbot session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
