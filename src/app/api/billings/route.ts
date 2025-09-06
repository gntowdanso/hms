import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.billing.findUnique({ where: { id: Number(id) }, include: { patient: true, admission: true, feesAndCharges: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.billing.findMany({ orderBy: { billingDate: 'desc' }, include: { patient: true, admission: true, feesAndCharges: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data: any = { ...body };
    if (data.patientId !== undefined) data.patientId = Number(data.patientId);
    if (data.admissionId !== undefined && data.admissionId !== null && data.admissionId !== '') data.admissionId = Number(data.admissionId); else data.admissionId = null;
    if (data.feesAndChargesId !== undefined) data.feesAndChargesId = Number(data.feesAndChargesId);
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.totalAmount !== undefined) data.totalAmount = Number(data.totalAmount);
    if (data.billingDate) data.billingDate = new Date(data.billingDate);

    // Auto-compute totalAmount if not provided
    if (data.totalAmount === undefined || data.totalAmount === null) {
      const fee = await prisma.feesAndCharges.findUnique({ where: { id: data.feesAndChargesId } });
      if (!fee) return NextResponse.json({ error: 'Invalid feesAndChargesId' }, { status: 400 });
      data.totalAmount = (Number(data.quantity) || 0) * Number(fee.amountPerUnit);
    }

    const created = await prisma.billing.create({ data });
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
    if (data.admissionId !== undefined) data.admissionId = data.admissionId ? Number(data.admissionId) : null;
    if (data.feesAndChargesId !== undefined) data.feesAndChargesId = Number(data.feesAndChargesId);
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.totalAmount !== undefined) data.totalAmount = Number(data.totalAmount);
    if (data.billingDate !== undefined) data.billingDate = data.billingDate ? new Date(data.billingDate) : null;
    const updated = await prisma.billing.update({ where: { id: parsedId }, data });
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
    await prisma.billing.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
