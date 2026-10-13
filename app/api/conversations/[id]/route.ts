import { NextRequest, NextResponse } from 'next/server';
import { 
  getConversationDetail, 
  updateConversationStatus, 
  updateConversationPriority, 
  updateConversationAssignee 
} from '@/lib/queries/conversations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await getConversationDetail(id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('Error fetching conversation detail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority, assignedUserId } = body;

    if (status) {
      await updateConversationStatus(id, status);
    }
    if (priority) {
      await updateConversationPriority(id, priority);
    }
    if (assignedUserId !== undefined) {
      await updateConversationAssignee(id, assignedUserId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
