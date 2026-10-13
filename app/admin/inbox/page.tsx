import React from 'react';
import { getConversationsList } from '@/lib/queries/conversations';
import { InboxClient } from './InboxClient';


export default async function InboxPage() {
  const conversations = await getConversationsList({ schoolId: 1, limit: 50 });

  return <InboxClient initialConversations={conversations} />;
}
