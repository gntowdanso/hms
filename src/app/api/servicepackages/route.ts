import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.servicePackage.findUnique({ where: { id: Number(id) }, include: { includedTests: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.servicePackage.findMany({ orderBy: { packageName: 'asc' }, include: { includedTests: true } });
    return NextResponse.json(list);
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
function validate(body: any) {
  const errs: string[] = [];
  if (!body.packageName) errs.push('packageName required');
  if (body.price == null || body.price === '') errs.push('price required');
  return errs;
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const { includedTestIds = [], ...rest } = raw || {};
    const data = {
      packageName: rest.packageName?.toString().trim(),
      description: rest.description || null,
      price: Number(rest.price || 0),
      discount: rest.discount === '' || rest.discount == null ? null : Number(rest.discount),
    };
    const errs = validate(data);
    if (errs.length) return NextResponse.json({ error: errs.join(', ') }, { status: 400 });
    if (Number.isNaN(data.price)) return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    if (data.discount !== null && Number.isNaN(data.discount)) return NextResponse.json({ error: 'Invalid discount' }, { status: 400 });
    const connectIds = (Array.isArray(includedTestIds) ? includedTestIds : []).map((id:any)=> ({ id: Number(id) })).filter(o=> !Number.isNaN(o.id));
    const created = await prisma.servicePackage.create({ data: { ...data, includedTests: { connect: connectIds } } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /api/servicepackages error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const raw = await req.json();
    const { id, includedTestIds = [], ...rest } = raw || {};
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (rest.packageName !== undefined) data.packageName = rest.packageName.toString().trim();
    if (rest.description !== undefined) data.description = rest.description || null;
    if (rest.price !== undefined) { data.price = Number(rest.price); if (Number.isNaN(data.price)) return NextResponse.json({ error: 'Invalid price' }, { status: 400 }); }
    if (rest.discount !== undefined) data.discount = rest.discount === '' || rest.discount == null ? null : Number(rest.discount);
    if (data.discount !== undefined && data.discount !== null && Number.isNaN(data.discount)) return NextResponse.json({ error: 'Invalid discount' }, { status: 400 });
    const setIds = (Array.isArray(includedTestIds) ? includedTestIds : []).map((id:any)=> ({ id: Number(id) })).filter(o=> !Number.isNaN(o.id));
    const updated = await prisma.servicePackage.update({ where: { id: Number(id) }, data: { ...data, includedTests: { set: setIds } } });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('PUT /api/servicepackages error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function DELETE(req: Request) { try { const body=await req.json(); const id=Number(body?.id); if(!id) return NextResponse.json({error:'Missing id'},{status:400}); await prisma.servicePackage.delete({ where:{id} }); return NextResponse.json({success:true}); } catch { return NextResponse.json({error:'Internal server error'},{status:500});}}
