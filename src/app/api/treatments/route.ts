import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.treatment.findUnique({
        where: { id: Number(id) },
        include: { patient: true, doctor: true },
      });
      return NextResponse.json(item);
    }
    const list = await prisma.treatment.findMany({
      orderBy: { treatmentDate: 'desc' },
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
    const { username, patientId, doctorId, treatmentName, treatmentDate, notes, outcome } = body || {};
    if (!patientId || !treatmentName || !treatmentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let finalDoctorId = doctorId ? Number(doctorId) : undefined;
    if (!finalDoctorId && username) {
      const d = await prisma.doctor.findFirst({ where: { username: String(username) } });
      if (d) finalDoctorId = d.id;
    }
    const data: any = {
      username: username || `treat-${Date.now()}`,
      patientId: Number(patientId),
      doctorId: finalDoctorId ?? undefined,
      treatmentName: String(treatmentName),
      treatmentDate: new Date(treatmentDate),
      notes: notes ? String(notes) : null,
      outcome: outcome ? String(outcome) : null,
    };
    // If still missing doctorId, return validation error (can be null in schema? No, it's required) so enforce presence.
    if (!data.doctorId) {
      return NextResponse.json({ error: 'doctorId required or infer via username login' }, { status: 400 });
    }
    const created = await prisma.treatment.create({ data });
    return NextResponse.json(created);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, username, ...rest } = body || {};
    const parsedId = Number(id);
    if (!id || Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = { ...rest };
    if (data.patientId !== undefined) data.patientId = Number(data.patientId);
    if (data.doctorId !== undefined && data.doctorId !== null && data.doctorId !== '') data.doctorId = Number(data.doctorId);
    if (data.treatmentDate !== undefined) data.treatmentDate = data.treatmentDate ? new Date(data.treatmentDate) : null;
    const updated = await prisma.treatment.update({ where: { id: parsedId }, data });
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
    await prisma.treatment.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
