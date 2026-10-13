import React from 'react';
import { getAdmissionBoardRecords } from '@/lib/queries/admission';
import { AdmissionClient } from './AdmissionClient';


export default async function AdmissionPage() {
  const records = await getAdmissionBoardRecords(1);

  return <AdmissionClient initialRecords={records} />;
}
