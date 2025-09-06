import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const labRequestId = searchParams.get('labRequestId');
  try {
    if (id) {
      const item = await prisma.labResult.findUnique({ where: { id: Number(id) }, include: { labRequest: true, details: true } });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (labRequestId) where.labRequestId = Number(labRequestId);
    const list = await prisma.labResult.findMany({ where, orderBy: { resultDate: 'desc' }, include: { labRequest: true, details: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, labRequestId, resultDetails, resultDate, verifiedBy, imageBase64, imageURL } = body || {};
    if (!labRequestId || !resultDetails || !resultDate || verifiedBy === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.labResult.create({
      data: {
        username: username || `labres-${Date.now()}`,
        labRequestId: Number(labRequestId),
        resultDetails: String(resultDetails),
        resultDate: new Date(resultDate),
        verifiedBy: Number(verifiedBy),
        imageBase64: imageBase64 ? String(imageBase64) : null,
        imageURL: imageURL ? String(imageURL) : null,
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
    if (data.verifiedBy !== undefined) data.verifiedBy = Number(data.verifiedBy);
    if (data.resultDate !== undefined) data.resultDate = data.resultDate ? new Date(data.resultDate) : null;
    const updated = await prisma.labResult.update({ where: { id: parsedId }, data });
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
    await prisma.labResult.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
