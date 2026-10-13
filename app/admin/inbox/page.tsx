import React from 'react';
import { getConversationsList } from '@/lib/queries/conversations';
import { InboxClient } from './InboxClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function InboxPage() {
  const conversations = await getConversationsList({ schoolId: 1, limit: 50 });

  return <InboxClient initialConversations={conversations} />;
}

