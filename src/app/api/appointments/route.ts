import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.appointment.findUnique({
        where: { id: Number(id) },
        include: { patient: true, doctor: true, department: true },
      });
      return NextResponse.json(item);
    }
    const list = await prisma.appointment.findMany({
      orderBy: { appointmentDate: 'desc' },
      include: { patient: true, doctor: true, department: true },
    });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, patientId, doctorId, departmentId, appointmentDate, reason, status } = body || {};
    if (!patientId || !doctorId || !departmentId || !appointmentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data: any = {
      username: username || `appt-${Date.now()}`,
      patientId: Number(patientId),
      doctorId: Number(doctorId),
      departmentId: Number(departmentId),
      appointmentDate: new Date(appointmentDate),
      reason: reason ? String(reason) : '',
      status: (status as any) || 'SCHEDULED',
    };
    const created = await prisma.appointment.create({ data });
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
    if (data.departmentId !== undefined) data.departmentId = Number(data.departmentId);
    if (data.appointmentDate !== undefined) data.appointmentDate = data.appointmentDate ? new Date(data.appointmentDate) : null;
    const updated = await prisma.appointment.update({ where: { id: parsedId }, data });
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
    await prisma.appointment.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
