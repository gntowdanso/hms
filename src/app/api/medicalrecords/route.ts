import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.medicalRecord.findUnique({
        where: { id: Number(id) },
        include: { patient: true, doctor: true },
      });
      return NextResponse.json(item);
    }
    const list = await prisma.medicalRecord.findMany({
      orderBy: { recordDate: 'desc' },
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
    const { username, doctorId, patientId, recordDate, diagnosis, treatmentsGiven, allergies, notes } = body || {};
    if (!patientId || !recordDate || !diagnosis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let finalDoctorId = doctorId ? Number(doctorId) : undefined;
    if (!finalDoctorId && username) {
      const d = await prisma.doctor.findFirst({ where: { username: String(username) } });
      if (d) finalDoctorId = d.id;
    }
    if (!finalDoctorId) {
      return NextResponse.json({ error: 'doctorId required or infer via username login' }, { status: 400 });
    }
    const data = {
      username: username || `mrec-${Date.now()}`,
      doctorId: finalDoctorId,
      patientId: Number(patientId),
      recordDate: new Date(recordDate),
      diagnosis: String(diagnosis),
      treatmentsGiven: treatmentsGiven ? String(treatmentsGiven) : null,
      allergies: allergies ? String(allergies) : null,
      notes: notes ? String(notes) : null,
    };
    const created = await prisma.medicalRecord.create({ data });
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
    if (data.doctorId !== undefined && data.doctorId !== null && data.doctorId !== '') data.doctorId = Number(data.doctorId);
    if (data.recordDate !== undefined) data.recordDate = data.recordDate ? new Date(data.recordDate) : null;
    const updated = await prisma.medicalRecord.update({ where: { id: parsedId }, data });
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
    await prisma.medicalRecord.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
