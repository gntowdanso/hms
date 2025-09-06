import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.labTest.findUnique({ where: { id: Number(id) }, include: { labtype: true, department: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.labTest.findMany({ orderBy: { testName: 'asc' }, include: { labtype: true, department: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, labTypeId, testName, description, departmentId, cost } = body || {};
    if (!labTypeId || !testName || !departmentId || cost === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.labTest.create({
      data: {
        username: username || `labtest-${Date.now()}`,
        labTypeId: Number(labTypeId),
        testName: String(testName),
        description: description ? String(description) : null,
        departmentId: Number(departmentId),
        cost: Number(cost),
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
    if (data.labTypeId !== undefined) data.labTypeId = Number(data.labTypeId);
    if (data.departmentId !== undefined) data.departmentId = Number(data.departmentId);
    if (data.cost !== undefined) data.cost = Number(data.cost);
    const updated = await prisma.labTest.update({ where: { id: parsedId }, data });
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
    await prisma.labTest.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
