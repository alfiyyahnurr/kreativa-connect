import { NextRequest, NextResponse } from 'next/server';
import { getTasksList, createTask, toggleTaskDone } from '@/lib/queries/tasks';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || 1;
    const isDoneParam = searchParams.get('isDone');
    const isDone = isDoneParam !== null ? isDoneParam === 'true' : undefined;

    const tasks = await getTasksList({ schoolId, isDone });
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { schoolId = 1, contactId, conversationId, assignedUserId, title, dueAt } = body;

    if (!contactId || !title || !dueAt) {
      return NextResponse.json({ error: 'contactId, title, and dueAt are required' }, { status: 400 });
    }

    const task = await createTask({
      schoolId,
      contactId,
      conversationId,
      assignedUserId,
      title,
      dueAt,
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isDone } = body;

    if (!id || isDone === undefined) {
      return NextResponse.json({ error: 'id and isDone are required' }, { status: 400 });
    }

    await toggleTaskDone(id, Boolean(isDone));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
