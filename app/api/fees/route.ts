import { NextRequest, NextResponse } from 'next/server';
import { getFeeStructuresBySchool } from '@/lib/queries/fees';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const schoolId = searchParams.get('schoolId') || 1;
    const campus = searchParams.get('campus') || undefined;
    const eduLevel = searchParams.get('eduLevel') || undefined;

    const fees = await getFeeStructuresBySchool(schoolId, { campus, edu_level: eduLevel });
    return NextResponse.json({ fees });
  } catch (error: any) {
    console.error('Error fetching fees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
