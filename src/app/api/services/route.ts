import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const s = await prisma.service.findUnique({ where: { id: Number(id) }, include: { category: true, sampleType: true, packages: true } });
      return NextResponse.json(s);
    }
    const list = await prisma.service.findMany({ orderBy: { serviceName: 'asc' }, include: { category: true, sampleType: true } });
    return NextResponse.json(list);
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
function validate(body: any) {
  const errs: string[] = [];
  if (!body.serviceName) errs.push('serviceName required');
  if (body.price == null || body.price === '') errs.push('price required');
  if (body.categoryId == null) errs.push('categoryId required');
  if (body.sampleTypeId == null) errs.push('sampleTypeId required');
  return errs;
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const { id: _ignore, ...body } = raw || {};
    // Cast numeric fields
    const data = {
      serviceName: body.serviceName?.toString().trim(),
      description: body.description || null,
      preparationInstructions: body.preparationInstructions || null,
      turnaroundTime: body.turnaroundTime || null,
      price: Number(body.price || 0),
      categoryId: Number(body.categoryId),
      sampleTypeId: Number(body.sampleTypeId),
    };
    const errs = validate(data);
    if (errs.length) return NextResponse.json({ error: errs.join(', ') }, { status: 400 });
    if (Number.isNaN(data.categoryId) || Number.isNaN(data.sampleTypeId)) return NextResponse.json({ error: 'Invalid categoryId/sampleTypeId' }, { status: 400 });
    const created = await prisma.service.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /api/services error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const raw = await req.json();
    const { id, ...rest } = raw || {};
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (rest.serviceName !== undefined) data.serviceName = rest.serviceName.toString().trim();
    if (rest.description !== undefined) data.description = rest.description || null;
    if (rest.preparationInstructions !== undefined) data.preparationInstructions = rest.preparationInstructions || null;
    if (rest.turnaroundTime !== undefined) data.turnaroundTime = rest.turnaroundTime || null;
    if (rest.price !== undefined) data.price = Number(rest.price || 0);
    if (rest.categoryId !== undefined) data.categoryId = Number(rest.categoryId);
    if (rest.sampleTypeId !== undefined) data.sampleTypeId = Number(rest.sampleTypeId);
    if (data.categoryId !== undefined && Number.isNaN(data.categoryId)) return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
    if (data.sampleTypeId !== undefined && Number.isNaN(data.sampleTypeId)) return NextResponse.json({ error: 'Invalid sampleTypeId' }, { status: 400 });
    const updated = await prisma.service.update({ where: { id: Number(id) }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PUT /api/services error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(req: Request){ try { const body=await req.json(); const id=Number(body?.id); if(!id) return NextResponse.json({error:'Missing id'},{status:400}); await prisma.service.delete({ where:{id} }); return NextResponse.json({success:true}); } catch { return NextResponse.json({error:'Internal server error'},{status:500});}}
