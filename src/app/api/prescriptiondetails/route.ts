import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prescriptionId = searchParams.get('prescriptionId');
  try {
    if (prescriptionId) {
      const list = await prisma.prescriptionDetail.findMany({
        where: { prescriptionId: Number(prescriptionId) },
        include: { medicine: true },
      });
      return NextResponse.json(list);
    }
    const list = await prisma.prescriptionDetail.findMany({ include: { medicine: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, prescriptionId, medicineId, dosage, frequency, duration } = body || {};
    if (!prescriptionId || !medicineId || !dosage || !frequency || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data: any = {
      username: username || `rxd-${Date.now()}`,
      prescriptionId: Number(prescriptionId),
      medicineId: Number(medicineId),
      dosage: String(dosage),
      frequency: String(frequency),
      duration: String(duration),
    };
    const created = await prisma.prescriptionDetail.create({ data });
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
    if (data.prescriptionId !== undefined) data.prescriptionId = Number(data.prescriptionId);
    if (data.medicineId !== undefined) data.medicineId = Number(data.medicineId);
    const updated = await prisma.prescriptionDetail.update({ where: { id: parsedId }, data });
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
    await prisma.prescriptionDetail.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
