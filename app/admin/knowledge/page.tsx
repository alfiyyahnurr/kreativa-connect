import React from 'react';
import { getKnowledgeBaseList } from '@/lib/queries/knowledge';
import { KnowledgeClient } from './KnowledgeClient';


export default async function KnowledgePage() {
  const articles = await getKnowledgeBaseList({ schoolId: 1 });

  return <KnowledgeClient initialArticles={articles} />;
}
