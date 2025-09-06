import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.doctor.findUnique({ where: { id: Number(id) }, include: { department: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.doctor.findMany({ include: { department: true } });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, staffNo, firstName, lastName, specialty, qualification, departmentId, contactInfo, email, employmentDate, licenseNumber } = body || {};
    if (!staffNo || !firstName || !lastName || !departmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const data: any = {
      username: username || `${String(firstName).toLowerCase()}-${String(lastName).toLowerCase()}-${Date.now()}`,
      staffNo: String(staffNo),
      firstName: String(firstName),
      lastName: String(lastName),
      specialty: specialty ? String(specialty) : '',
      qualification: qualification ? String(qualification) : '',
      departmentId: Number(departmentId),
      contactInfo: contactInfo ? String(contactInfo) : '',
      email: email ? String(email) : '',
      employmentDate: employmentDate ? new Date(employmentDate) : new Date(),
      licenseNumber: licenseNumber ? String(licenseNumber) : ''
    };
    const created = await prisma.doctor.create({ data });
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
    if (data.employmentDate !== undefined) data.employmentDate = data.employmentDate ? new Date(data.employmentDate) : null;
    const updated = await prisma.doctor.update({ where: { id: parsedId }, data });
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
    await prisma.doctor.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
