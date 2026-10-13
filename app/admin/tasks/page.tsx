import React from 'react';
import { getTasksList } from '@/lib/queries/tasks';
import { TasksClient } from './TasksClient';


export default async function TasksPage() {
  const tasks = await getTasksList({ schoolId: 1 });

  return <TasksClient initialTasks={tasks} />;
}
