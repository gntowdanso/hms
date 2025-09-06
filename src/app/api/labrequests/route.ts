import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const patientId = searchParams.get('patientId');
  try {
    if (id) {
      const item = await prisma.labRequest.findUnique({ where: { id: Number(id) }, include: { patient: true, doctor: true, test: { include: { labtype: true, department: true } }, result: true } });
      return NextResponse.json(item);
    }
    const where: any = {};
    if (patientId) where.patientId = Number(patientId);
    const list = await prisma.labRequest.findMany({ where, orderBy: { requestDate: 'desc' }, include: { patient: true, doctor: true, test: true, result: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, patientId, doctorId, testId, requestDate, status, imageBase64, imageURL } = body || {};
    if (!patientId || !doctorId || !testId || !requestDate || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const created = await prisma.labRequest.create({
      data: {
        username: username || `labreq-${Date.now()}`,
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        testId: Number(testId),
        requestDate: new Date(requestDate),
        status: String(status),
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
    if (data.patientId !== undefined) data.patientId = Number(data.patientId);
    if (data.doctorId !== undefined) data.doctorId = Number(data.doctorId);
    if (data.testId !== undefined) data.testId = Number(data.testId);
    if (data.requestDate !== undefined) data.requestDate = data.requestDate ? new Date(data.requestDate) : null;
    const updated = await prisma.labRequest.update({ where: { id: parsedId }, data });
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
    await prisma.labRequest.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
