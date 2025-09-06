import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function hasAccess(role: string) {
  // allow only Admin for management operations when role is provided
  return role === 'Admin';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const dept = searchParams.get('departmentId');
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const where: any = {};
    if (dept) where.departmentId = Number(dept);

    const wards = await prisma.ward.findMany({ where, include: { department: true, rooms: true } });
    return NextResponse.json(wards);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, capacity, departmentId, username } = body;
    const role = body.role ?? body.roleId ?? null;
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const ward = await prisma.ward.create({ data: { name, capacity: Number(capacity || 0), departmentId: Number(departmentId), username: username ?? name } });
    return NextResponse.json(ward);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, capacity, departmentId, username } = body;
    const role = body.role ?? body.roleId ?? null;
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const ward = await prisma.ward.update({ where: { id: Number(id) }, data: { name, capacity: Number(capacity || 0), departmentId: Number(departmentId), username: username ?? name } });
    return NextResponse.json(ward);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role } = body;
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    await prisma.ward.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
