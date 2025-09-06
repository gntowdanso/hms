import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const labResultId = searchParams.get('labResultId');
  const labRequestId = searchParams.get('labRequestId');
  try {
    if (id) {
      const item = await prisma.labResultDetails.findUnique({ where: { id: Number(id) } });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (labResultId) where.labResultId = Number(labResultId);
    if (labRequestId) where.labRequestId = Number(labRequestId);
    const list = await prisma.labResultDetails.findMany({ where, orderBy: { id: 'asc' } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, labRequestId, labResultId, code, result, referenceRange, flag, rating, unit } = body || {};
    if (!labRequestId || !labResultId || !code || !result) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.labResultDetails.create({
      data: {
        username: username || `labdet-${Date.now()}`,
        labRequestId: Number(labRequestId),
        labResultId: Number(labResultId),
        code: String(code),
        result: String(result),
        referenceRange: referenceRange ? String(referenceRange) : null,
        flag: flag ? String(flag) : null,
        rating: rating ? String(rating) : null,
        unit: unit ? String(unit) : null,
      },
    });
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
    if (data.labRequestId !== undefined) data.labRequestId = Number(data.labRequestId);
    if (data.labResultId !== undefined) data.labResultId = Number(data.labResultId);
    const updated = await prisma.labResultDetails.update({ where: { id: parsedId }, data });
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
    await prisma.labResultDetails.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
