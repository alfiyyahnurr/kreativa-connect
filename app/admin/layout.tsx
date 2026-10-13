import React from 'react';
import { AdminShellClient } from './AdminShellClient';
import { getOverdueTasksCount } from '@/lib/queries/tasks';


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const overdueCount = await getOverdueTasksCount(1);

  return (
    <AdminShellClient overdueCount={overdueCount}>
      {children}
    </AdminShellClient>
  );
}
