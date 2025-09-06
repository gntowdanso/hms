import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function hasAccess(role: string) {
  return role === 'Admin';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const ward = searchParams.get('wardId');
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const where: any = {};
    if (ward) where.wardId = Number(ward);

    const rooms = await prisma.room.findMany({ where, include: { ward: true, admissions: true } });
    return NextResponse.json(rooms);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wardId, roomNumber, bedNumber, status, username } = body;
    const role = body.role ?? body.roleId ?? null;
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const room = await prisma.room.create({ data: { wardId: Number(wardId), roomNumber: String(roomNumber || ''), bedNumber: String(bedNumber || ''), status: status || 'AVAILABLE', username: username ?? `room-${Date.now()}` } });
    return NextResponse.json(room);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, wardId, roomNumber, bedNumber, status, username } = body;
    const role = body.role ?? body.roleId ?? null;
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const room = await prisma.room.update({ where: { id: Number(id) }, data: { wardId: Number(wardId), roomNumber: String(roomNumber || ''), bedNumber: String(bedNumber || ''), status: status || 'AVAILABLE', username: username ?? `room-${id}` } });
    return NextResponse.json(room);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role } = body;
    if (role && !hasAccess(role)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    await prisma.room.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
