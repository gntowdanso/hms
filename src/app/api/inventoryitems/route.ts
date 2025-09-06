import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.inventoryItem.findUnique({ where: { id: Number(id) }, include: { supplier: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.inventoryItem.findMany({ orderBy: { name: 'asc' }, include: { supplier: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data: any = { ...body };
    data.quantity = Number(data.quantity);
    data.unitCost = Number(data.unitCost);
    data.supplierId = Number(data.supplierId);
    const created = await prisma.inventoryItem.create({ data });
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
    if (data.quantity !== undefined) data.quantity = Number(data.quantity);
    if (data.unitCost !== undefined) data.unitCost = Number(data.unitCost);
    if (data.supplierId !== undefined) data.supplierId = Number(data.supplierId);
    const updated = await prisma.inventoryItem.update({ where: { id: parsedId }, data });
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
    await prisma.inventoryItem.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
