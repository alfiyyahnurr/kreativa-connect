import React from 'react';
import { getSchoolSettings } from '@/lib/queries/settings';
import { SettingsClient } from './SettingsClient';


export default async function SettingsPage() {
  const settings = await getSchoolSettings(1);

  return <SettingsClient initialSettings={settings} />;
}
