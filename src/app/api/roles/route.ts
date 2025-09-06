import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({ select: { id: true, roleName: true } });
    return NextResponse.json(roles);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load roles' }, { status: 500 });
  }
}
