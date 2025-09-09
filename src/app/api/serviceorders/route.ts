import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const order = await prisma.serviceOrder.findUnique({ where: { id: Number(id) }, include: { patient: true, service: true, servicePackage: true, report: true, payments: true } });
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(order);
    }
  const list = await prisma.serviceOrder.findMany({ orderBy: { createdAt: 'desc' }, include: { patient: true, service: true, servicePackage: true, report: true, payments: true } });
  console.log('ServiceOrders API count:', list.length);
  return NextResponse.json(list, { headers:{ 'Cache-Control':'no-store' } });
  } catch (e) {
    // Enhanced logging to help diagnose 500s (likely missing migrations / tables)
    console.error('GET /api/serviceorders error:', e);
    if (process.env.NODE_ENV !== 'production') {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return NextResponse.json({ error: 'Internal server error', detail: msg }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function validatePayload(data: any) {
  const { patientId, serviceId, packageId } = data;
  if (!patientId) return 'patientId is required';
  if (!serviceId && !packageId) return 'Either serviceId or packageId is required';
  if (serviceId && packageId) return 'Provide only one of serviceId or packageId';
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const err = validatePayload(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    // Ensure related records exist
    const patient = await prisma.patient.findUnique({ where: { id: Number(body.patientId) } });
    if (!patient) return NextResponse.json({ error: 'Invalid patientId' }, { status: 400 });
    if (body.serviceId) {
      const svc = await prisma.service.findUnique({ where: { id: Number(body.serviceId) } });
      if (!svc) return NextResponse.json({ error: 'Invalid serviceId' }, { status: 400 });
    }
    if (body.packageId) {
      const pkg = await prisma.servicePackage.findUnique({ where: { id: Number(body.packageId) } });
      if (!pkg) return NextResponse.json({ error: 'Invalid packageId' }, { status: 400 });
    }
    const created = await prisma.serviceOrder.create({ data: {
      patientId: Number(body.patientId),
      doctorReferral: !!body.doctorReferral,
      serviceId: body.serviceId ? Number(body.serviceId) : null,
      packageId: body.packageId ? Number(body.packageId) : null,
      appointmentId: body.appointmentId ? Number(body.appointmentId) : null,
      status: body.status || 'Pending'
    }});
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
  console.error('POST /api/serviceorders error:', e);
  const msg = (process.env.NODE_ENV !== 'production' && e instanceof Error) ? e.message : 'Internal server error';
  return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const err = validatePayload(rest);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const existing = await prisma.serviceOrder.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = await prisma.serviceOrder.update({ where: { id: Number(id) }, data: {
      patientId: Number(rest.patientId),
      doctorReferral: !!rest.doctorReferral,
      serviceId: rest.serviceId ? Number(rest.serviceId) : null,
      packageId: rest.packageId ? Number(rest.packageId) : null,
      appointmentId: rest.appointmentId ? Number(rest.appointmentId) : null,
      status: rest.status || existing.status
    }});
    return NextResponse.json(updated);
  } catch (e) {
  console.error('PUT /api/serviceorders error:', e);
  const msg = (process.env.NODE_ENV !== 'production' && e instanceof Error) ? e.message : 'Internal server error';
  return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = Number(body?.id);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.serviceOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
  console.error('DELETE /api/serviceorders error:', e);
  const msg = (process.env.NODE_ENV !== 'production' && e instanceof Error) ? e.message : 'Internal server error';
  return NextResponse.json({ error: msg }, { status: 500 });
  }
}
