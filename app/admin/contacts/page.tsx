import React from 'react';
import { getContactsList } from '@/lib/queries/contacts';
import { ContactsClient } from './ContactsClient';


export default async function ContactsPage() {
  const contacts = await getContactsList({ schoolId: 1, limit: 50 });

  return <ContactsClient initialContacts={contacts} />;
}
