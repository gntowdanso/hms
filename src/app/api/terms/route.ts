import { NextResponse } from 'next/server';

// Legacy endpoint stubbed out (no Term/AcademicYear models in current schema)
export async function GET() { return NextResponse.json([]); }
export async function POST() { return NextResponse.json({ error: 'Not implemented' }, { status: 501 }); }
export async function PUT() { return NextResponse.json({ error: 'Not implemented' }, { status: 501 }); }
export async function DELETE() { return NextResponse.json({ error: 'Not implemented' }, { status: 501 }); }
