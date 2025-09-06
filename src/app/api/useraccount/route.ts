import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to check access
function hasAccess(role: string) {
  // Only allow Admins to access user accounts
  return role === 'Admin';
}

export async function GET(req: NextRequest) {
  // For demo, get role from query param (replace with real auth in production)
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  if (!hasAccess(role ?? '')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const users = await prisma.userAccount.findMany();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { username, passwordHash, role, isActive } = await req.json();
  if (!hasAccess(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const user = await prisma.userAccount.create({
    data: { username, passwordHash, role, isActive }
  });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const { id, username, passwordHash, role, isActive } = await req.json();
  if (!hasAccess(role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const user = await prisma.userAccount.update({
    where: { id },
    data: { username, passwordHash, role, isActive }
  });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest) {
  const { id, roleId } = await req.json();
  if (!hasAccess(roleId)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  await prisma.userAccount.delete({ where: { id } });
  return NextResponse.json({ message: 'Deleted' });
}
