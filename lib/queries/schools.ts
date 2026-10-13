import { sql } from '@/lib/db/neon';

export interface School {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAllSchools(): Promise<School[]> {
  const rows = await sql`
    SELECT id, name, slug, address, phone, email, logo_url, is_active, created_at, updated_at
    FROM schools
    WHERE is_active = TRUE
    ORDER BY id ASC
  `;
  return rows as School[];
}

export async function getSchoolById(schoolId: number | string): Promise<School | null> {
  const rows = await sql`
    SELECT id, name, slug, address, phone, email, logo_url, is_active, created_at, updated_at
    FROM schools
    WHERE id = ${schoolId}
    LIMIT 1
  `;
  return (rows[0] as School) || null;
}

export async function getSchoolBySlug(slug: string): Promise<School | null> {
  const rows = await sql`
    SELECT id, name, slug, address, phone, email, logo_url, is_active, created_at, updated_at
    FROM schools
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return (rows[0] as School) || null;
}
