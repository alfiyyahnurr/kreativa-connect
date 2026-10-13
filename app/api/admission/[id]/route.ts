import { NextRequest, NextResponse } from 'next/server';
import { updateAdmissionStage, getAdmissionLogs } from '@/lib/queries/admission';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { stage, userId = 1, notes } = body;

    if (!stage) {
      return NextResponse.json({ error: 'Stage is required' }, { status: 400 });
    }

    await updateAdmissionStage(id, stage, userId, notes);
    const logs = await getAdmissionLogs(id);

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error('Error updating admission stage:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await getAdmissionLogs(id);
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching admission logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
