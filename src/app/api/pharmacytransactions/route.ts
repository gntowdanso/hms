import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.pharmacyTransaction.findUnique({ where: { id: Number(id) }, include: { medicine: true, patient: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.pharmacyTransaction.findMany({
      orderBy: { transactionDate: 'desc' },
      include: { medicine: true, patient: true },
    });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data: any = { ...body };
    data.medicineId = Number(data.medicineId);
    data.patientId = Number(data.patientId);
    data.quantity = Number(data.quantity);
    if (data.transactionDate) data.transactionDate = new Date(data.transactionDate);
    const created = await prisma.pharmacyTransaction.create({ data });
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
    if (data.medicineId !== undefined) data.medicineId = Number(data.medicineId);
    if (data.patientId !== undefined) data.patientId = Number(data.patientId);
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.transactionDate !== undefined) data.transactionDate = data.transactionDate ? new Date(data.transactionDate) : null;
    const updated = await prisma.pharmacyTransaction.update({ where: { id: parsedId }, data });
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
    await prisma.pharmacyTransaction.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
