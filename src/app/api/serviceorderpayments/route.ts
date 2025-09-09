import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Payments for Service Orders
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const payment = await prisma.serviceOrderPayment.findUnique({ where: { id: Number(id) }, include: { patient: true, serviceOrder: true } });
      if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(payment);
    }
    const list = await prisma.serviceOrderPayment.findMany({ orderBy: { paymentDate: 'desc' }, include: { patient: true, serviceOrder: true } });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { patientId, serviceOrderId, amount, paymentMethod, status, transactionId } = body;
    if (!patientId || !serviceOrderId || amount == null || !paymentMethod || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const payment = await prisma.serviceOrderPayment.create({ data: {
      patientId: Number(patientId),
      serviceOrderId: Number(serviceOrderId),
      amount: Number(amount),
      paymentMethod: paymentMethod.toString(),
      status: status.toString(),
      transactionId: transactionId || null
    }});
    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const updated = await prisma.serviceOrderPayment.update({ where: { id: Number(id) }, data: {
      amount: rest.amount != null ? Number(rest.amount) : undefined,
      paymentMethod: rest.paymentMethod,
      status: rest.status,
      transactionId: rest.transactionId ?? null
    }});
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.serviceOrderPayment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
