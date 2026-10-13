import { NextRequest, NextResponse } from 'next/server';
import { getRootNode } from '@/lib/queries/chatbot';

export async function GET(req: NextRequest) {
  try {
    const schoolId = req.nextUrl.searchParams.get('schoolId') || 1;
    const rootNode = await getRootNode(schoolId);
    if (!rootNode) {
      return NextResponse.json({ error: 'Root node tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, rootNode });
  } catch (error: any) {
    console.error('Error fetching root node:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
