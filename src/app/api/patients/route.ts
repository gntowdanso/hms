import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const patients = await prisma.patient.findMany();
    return NextResponse.json(patients);
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data: any = {
      username: body.username || body.hospitalNo || '',
      hospitalNo: body.hospitalNo,
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender,
      address: body.address || '',
      contactInfo: body.contactInfo || '',
      emergencyContact: body.emergencyContact || '',
      admissionStatus: body.admissionStatus || 'OUTPATIENT',
      bloodGroup: body.bloodGroup || null,
      hospitalId: body.hospitalId || 1,
    };
    if (body.dob) data.dob = new Date(body.dob);
    const p = await prisma.patient.create({ data });
    return NextResponse.json(p);
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data: any = {
      hospitalNo: body.hospitalNo,
      firstName: body.firstName,
      lastName: body.lastName,
      gender: body.gender,
      address: body.address,
      contactInfo: body.contactInfo,
      emergencyContact: body.emergencyContact,
      admissionStatus: body.admissionStatus,
      bloodGroup: body.bloodGroup || null,
    };
    if (body.dob) data.dob = new Date(body.dob);
    const updated = await prisma.patient.update({
      where: { id: body.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || 'Error' }, { status: 500 });
  }
}
