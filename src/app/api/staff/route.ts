import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const staff = await prisma.staff.findUnique({ where: { id: Number(id) } });
    return NextResponse.json(staff);
  }
  const staffList = await prisma.staff.findMany({ include: { department: true } });
  return NextResponse.json(staffList);
}

export async function POST(req: Request) {
  const body = await req.json();
  const payload: any = { ...body };
  // map userName -> username if provided by client
  if (payload.userName && !payload.username) payload.username = payload.userName;
  const data: any = {
    staffNo: payload.staffNo,
    username: payload.username,
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: payload.role,
  // staffType removed for hospital model
    contactInfo: payload.contactInfo || null,
    email: payload.email || null,
    employmentDate: payload.employmentDate ? new Date(payload.employmentDate) : null,
  };
  if (payload.departmentId !== undefined && payload.departmentId !== null && payload.departmentId !== '') {
    const depId = Number(payload.departmentId);
    if (!Number.isNaN(depId)) {
      data.department = { connect: { id: depId } };
    }
  }
  // remove stray scalar keys that Prisma may reject
  if ((data as any).departmentId !== undefined) delete (data as any).departmentId;

  // ensure username exists and is unique
  const baseName = data.username || ((data.firstName || '') + '-' + (data.lastName || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `staff-${Date.now()}`;
  let username = String(baseName).toLowerCase();
  let attempt = 0;
  while (attempt < 10) {
    // eslint-disable-next-line no-await-in-loop
  const exists = await prisma.staff.findFirst({ where: { username } });
    if (!exists) break;
    attempt += 1;
    username = `${baseName}-${attempt}`;
  }
  data.username = username;

  console.debug('PRISMA create staff data:', data);
  try {
    const staff = await prisma.staff.create({ data });
    return NextResponse.json(staff);
  } catch (err: any) {
    console.error('POST /api/staff error', err);
    // Prisma unique constraint
    if (err?.code === 'P2002' && err?.meta?.target && Array.isArray(err.meta.target)) {
      return NextResponse.json({ error: `Unique constraint failed on fields: (${String(err.meta.target)})` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...rest } = body;
  const payload: any = { ...rest };
  if (payload.userName && !payload.username) payload.username = payload.userName;
  const data: any = {};
  if (payload.staffNo !== undefined) data.staffNo = payload.staffNo;
  if (payload.username !== undefined) data.username = payload.username;
  if (payload.firstName !== undefined) data.firstName = payload.firstName;
  if (payload.lastName !== undefined) data.lastName = payload.lastName;
  if (payload.role !== undefined) data.role = payload.role;
  // staffType removed for hospital model
  if (payload.contactInfo !== undefined) data.contactInfo = payload.contactInfo;
  if (payload.email !== undefined) data.email = payload.email;
  if (payload.employmentDate !== undefined) data.employmentDate = payload.employmentDate ? new Date(payload.employmentDate) : null;
  if (payload.departmentId !== undefined) {
    if (payload.departmentId === null || payload.departmentId === '') {
      data.department = { disconnect: true };
    } else {
      const depId = Number(payload.departmentId);
      if (!Number.isNaN(depId)) data.department = { connect: { id: depId } };
    }
  }
  const updated = await prisma.staff.update({ where: { id: Number(id) }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  await prisma.staff.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
