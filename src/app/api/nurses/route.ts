import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.nurse.findUnique({ where: { id: Number(id) }, include: { department: true, ward: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.nurse.findMany({ include: { department: true, ward: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, staffNo, firstName, lastName, qualification, departmentId, wardId, contactInfo, employmentDate } = body || {};
    if (!staffNo || !firstName || !lastName || !departmentId || !wardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data: any = {
      username: username || `${String(firstName).toLowerCase()}-${String(lastName).toLowerCase()}-${Date.now()}`,
      staffNo: String(staffNo),
      firstName: String(firstName),
      lastName: String(lastName),
      qualification: qualification ? String(qualification) : '',
      departmentId: Number(departmentId),
      wardId: Number(wardId),
      contactInfo: contactInfo ? String(contactInfo) : '',
      employmentDate: employmentDate ? new Date(employmentDate) : new Date()
    };
    const created = await prisma.nurse.create({ data });
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
    if (data.departmentId !== undefined) data.departmentId = Number(data.departmentId);
    if (data.wardId !== undefined) data.wardId = Number(data.wardId);
    if (data.employmentDate !== undefined) data.employmentDate = data.employmentDate ? new Date(data.employmentDate) : null;
    const updated = await prisma.nurse.update({ where: { id: parsedId }, data });
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
    await prisma.nurse.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
