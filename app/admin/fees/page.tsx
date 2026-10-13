import React from 'react';
import { getFeeStructuresBySchool } from '@/lib/queries/fees';
import { FeesClient } from './FeesClient';


export default async function FeesPage() {
  const fees = await getFeeStructuresBySchool(1);

  return <FeesClient initialFees={fees} />;
}
