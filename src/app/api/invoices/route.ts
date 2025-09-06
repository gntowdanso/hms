import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.invoice.findUnique({ where: { id: Number(id) }, include: { billing: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.invoice.findMany({ orderBy: { issueDate: 'desc' }, include: { billing: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data: any = { ...body };
    if (data.billingId !== undefined) data.billingId = Number(data.billingId);
    if (data.amount !== undefined) data.amount = Number(data.amount);
    if (data.issueDate) data.issueDate = new Date(data.issueDate);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);

    // Default amount from billing if not provided
    if (data.amount === undefined || data.amount === null) {
      const billing = await prisma.billing.findUnique({ where: { id: data.billingId } });
      if (!billing) return NextResponse.json({ error: 'Invalid billingId' }, { status: 400 });
      data.amount = billing.totalAmount;
    }

    const created = await prisma.invoice.create({ data });
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
    if (data.billingId !== undefined) data.billingId = Number(data.billingId);
    if (data.amount !== undefined) data.amount = Number(data.amount);
    if (data.issueDate !== undefined) data.issueDate = data.issueDate ? new Date(data.issueDate) : null;
    if (data.dueDate !== undefined) data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const updated = await prisma.invoice.update({ where: { id: parsedId }, data });
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
    await prisma.invoice.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
