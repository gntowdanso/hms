import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.admission.findUnique({
        where: { id: Number(id) },
        include: { patient: true, doctor: true, ward: true, room: true, billing: true },
      });
      return NextResponse.json(item);
    }
    const list = await prisma.admission.findMany({
      orderBy: { admissionDate: 'desc' },
      include: { patient: true, doctor: true, ward: true, room: true, billing: true },
    });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, patientId, doctorId, wardId, roomId, admissionDate, dischargeDate, status } = body || {};
    if (!patientId || !doctorId || !wardId || !roomId || !admissionDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data: any = {
      username: username || `adm-${Date.now()}`,
      patientId: Number(patientId),
      doctorId: Number(doctorId),
      wardId: Number(wardId),
      roomId: Number(roomId),
      admissionDate: new Date(admissionDate),
      dischargeDate: dischargeDate ? new Date(dischargeDate) : null,
      status: status ? String(status) : 'ACTIVE',
    };
    const created = await prisma.admission.create({ data });
    return NextResponse.json(created);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body || {};
    const parsedId = Number(id);
    if (!id || Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = { ...rest };
    if (data.patientId !== undefined) data.patientId = Number(data.patientId);
    if (data.doctorId !== undefined) data.doctorId = Number(data.doctorId);
    if (data.wardId !== undefined) data.wardId = Number(data.wardId);
    if (data.roomId !== undefined) data.roomId = Number(data.roomId);
    if (data.admissionDate !== undefined) data.admissionDate = data.admissionDate ? new Date(data.admissionDate) : null;
    if (data.dischargeDate !== undefined) data.dischargeDate = data.dischargeDate ? new Date(data.dischargeDate) : null;
    const updated = await prisma.admission.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const parsedId = Number(body?.id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.admission.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
