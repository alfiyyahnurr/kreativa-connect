import React from 'react';
import { getAdmissionBoardRecords, AdmissionCardItem } from '@/lib/queries/admission';
import { AdmissionClient } from './AdmissionClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_ADMISSION_RECORDS: AdmissionCardItem[] = [
  {
    id: '1',
    school_id: '1',
    student_id: '1',
    contact_id: '1',
    academic_year: '2026/2027',
    stage: 'accepted',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Alya Putri',
    edu_level: 'kindergarten_2',
    student_number: null,
    parent_name: 'Nadia Putri',
    parent_phone: '+6281200001042',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
  {
    id: '2',
    school_id: '1',
    student_id: '2',
    contact_id: '2',
    academic_year: '2026/2027',
    stage: 'first_payment_pending',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Faris Hakim',
    edu_level: 'primary',
    student_number: null,
    parent_name: 'Rizky Fadilah',
    parent_phone: '+6281300003321',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
  {
    id: '3',
    school_id: '1',
    student_id: '3',
    contact_id: '3',
    academic_year: '2026/2027',
    stage: 'assessment_scheduled',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Zara Humaira',
    edu_level: 'kindergarten_1',
    student_number: null,
    parent_name: 'Sarah Humaira',
    parent_phone: '+6282100001920',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
  {
    id: '4',
    school_id: '1',
    student_id: '4',
    contact_id: '4',
    academic_year: '2026/2027',
    stage: 'parent_interview',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Khalid Permana',
    edu_level: 'secondary',
    student_number: null,
    parent_name: 'Dimas Permana',
    parent_phone: '+6281700008891',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
  {
    id: '5',
    school_id: '1',
    student_id: '5',
    contact_id: '5',
    academic_year: '2026/2027',
    stage: 'registered',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Amira Maharani',
    edu_level: 'high_school',
    student_number: null,
    parent_name: 'Fina Maharani',
    parent_phone: '+6281500006201',
    lead_temp: 'warm',
    assigned_name: 'Admission',
  },
  {
    id: '7',
    school_id: '1',
    student_id: '10',
    contact_id: '10',
    academic_year: '2026/2027',
    stage: 'assessment_completed',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Yusuf Hidayat',
    edu_level: 'high_school',
    student_number: null,
    parent_name: 'Taufik Hidayat',
    parent_phone: '+6281200009088',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
  {
    id: '8',
    school_id: '1',
    student_id: '11',
    contact_id: '11',
    academic_year: '2026/2027',
    stage: 'confirmation_letter_pending',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Safa Anjani',
    edu_level: 'primary',
    student_number: null,
    parent_name: 'Laila Anjani',
    parent_phone: '+6287700008809',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
  {
    id: '9',
    school_id: '1',
    student_id: '12',
    contact_id: '12',
    academic_year: '2026/2027',
    stage: 'enrollment_completed',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Nayla Zahra',
    edu_level: 'kindergarten_2',
    student_number: null,
    parent_name: 'Yumna Zahra',
    parent_phone: '+6281100002772',
    lead_temp: 'hot',
    assigned_name: 'Admission',
  },
];

export default async function AdmissionPage() {
  let records: AdmissionCardItem[] = [];

  try {
    const raw = await getAdmissionBoardRecords(1);
    if (raw && raw.length > 0) {
      records = JSON.parse(JSON.stringify(raw));
    } else {
      records = FALLBACK_ADMISSION_RECORDS;
    }
  } catch (error) {
    console.warn('Error fetching admission board records from DB, using fallback data:', error);
    records = FALLBACK_ADMISSION_RECORDS;
  }

  return <AdmissionClient initialRecords={records} />;
}
