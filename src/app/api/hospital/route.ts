import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const hospital = await prisma.hospital.findUnique({ where: { id: Number(id) }, include: { Department: true, Patient: true } });
    return NextResponse.json(hospital);
  }
  const hospitals = await prisma.hospital.findMany({ include: { Department: true, Patient: true } });
  return NextResponse.json(hospitals);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { username, name, address, contactInfo, licenseNumber, establishedDate, type } = body;
  if (!name || !licenseNumber || !establishedDate || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const data = {
    username: username || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    address,
    contactInfo,
    licenseNumber,
    establishedDate: new Date(establishedDate),
    type,
  };
  try {
    const hospital = await prisma.hospital.create({ data });
    return NextResponse.json(hospital);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const data = { ...rest };
  if (data.establishedDate) data.establishedDate = new Date(data.establishedDate);
  try {
    const hospital = await prisma.hospital.update({ where: { id: Number(id) }, data });
    return NextResponse.json(hospital);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    await prisma.hospital.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
