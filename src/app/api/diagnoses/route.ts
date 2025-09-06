import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.diagnosis.findUnique({
        where: { id: Number(id) },
        include: { patient: true, doctor: true },
      });
      return NextResponse.json(item);
    }
    const list = await prisma.diagnosis.findMany({
      orderBy: { date: 'desc' },
      include: { patient: true, doctor: true },
    });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, patientId, doctorId, date, condition, notes } = body || {};
    if (!patientId || !doctorId || !date || !condition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data: any = {
      username: username || `diag-${Date.now()}`,
      patientId: Number(patientId),
      doctorId: Number(doctorId),
      date: new Date(date),
      condition: String(condition),
      notes: notes ? String(notes) : null,
    };
    const created = await prisma.diagnosis.create({ data });
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
    if (data.date !== undefined) data.date = data.date ? new Date(data.date) : null;
    const updated = await prisma.diagnosis.update({ where: { id: parsedId }, data });
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
    await prisma.diagnosis.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
