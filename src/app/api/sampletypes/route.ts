import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  try {
    if (id) {
      const item = await prisma.sampleType.findUnique({ where: { id: Number(id) }, include: { services: true } });
      return NextResponse.json(item);
    }
    const list = await prisma.sampleType.findMany({ orderBy: { sampleName: 'asc' } });
    return NextResponse.json(list);
  } catch (e) { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); }
}
export async function POST(req: Request) { try { const body = await req.json(); const c = await prisma.sampleType.create({ data: body }); return NextResponse.json(c);} catch{ return NextResponse.json({ error:'Internal server error'},{status:500});}}
export async function PUT(req: Request) { try { const body=await req.json(); const {id,...rest}=body; if(!id) return NextResponse.json({error:'Missing id'},{status:400}); const u= await prisma.sampleType.update({where:{id:Number(id)},data:rest}); return NextResponse.json(u);}catch{ return NextResponse.json({error:'Internal server error'},{status:500});}}
export async function DELETE(req: Request){ try { const body=await req.json(); const id=Number(body?.id); if(!id) return NextResponse.json({error:'Missing id'},{status:400}); await prisma.sampleType.delete({where:{id}}); return NextResponse.json({success:true}); }catch{ return NextResponse.json({error:'Internal server error'},{status:500});}}
