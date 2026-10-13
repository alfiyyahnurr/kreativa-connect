import { NextRequest, NextResponse } from 'next/server';
import { getConversationsList } from '@/lib/queries/conversations';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || 1;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit')) || 50;

    const conversations = await getConversationsList({
      schoolId,
      status,
      search,
      limit,
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
