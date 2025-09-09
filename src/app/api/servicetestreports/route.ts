import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Simple fallback summarizer (can be replaced with real AI integration)
function basicSummarize(text: string, maxChars = 400): string {
  if(!text) return '';
  const clean = text.replace(/\r/g,'').split('\n').map(l=>l.trim()).filter(Boolean);
  const joined = clean.join(' ');
  if(joined.length <= maxChars) return joined;
  return joined.slice(0,maxChars).trim()+ '...';
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url); const id = searchParams.get('id');
  try { if(id){ const r = await prisma.serviceTestReport.findUnique({ where:{ id:Number(id) }, include:{ serviceOrder:true, reportedByUser:true } }); return NextResponse.json(r);} const list = await prisma.serviceTestReport.findMany({ orderBy:{ reportDate:'desc' } }); return NextResponse.json(list);} catch { return NextResponse.json({ error:'Internal server error'},{status:500}); }
}
export async function POST(req: Request){
  try {
    const contentType = req.headers.get('content-type') || '';
    let data: any = {};
    if(contentType.includes('multipart/form-data')){
      const fd = await req.formData();
      const orderIdRaw = fd.get('orderId');
      if(!orderIdRaw) return NextResponse.json({error:'orderId required'},{status:400});
      const orderId = Number(orderIdRaw);
      if(Number.isNaN(orderId)) return NextResponse.json({error:'orderId must be a number'},{status:400});

      // Enforce one report per order
      const existing = await prisma.serviceTestReport.findUnique({ where:{ orderId } });
      if(existing) return NextResponse.json({error:'Report already exists for this order'},{status:400});

  const findings = (fd.get('findings')||'') as string;
  let actualResult: string | undefined = undefined;
      let comments = (fd.get('comments')||'') as string;
      const file: File | null = fd.get('reportFile') instanceof File ? fd.get('reportFile') as File : null;
      let filePath: string | undefined; let reportBase64: string | undefined; let resultValues: any = undefined;
      if(file){
        filePath = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buff = Buffer.from(arrayBuffer);
        reportBase64 = buff.toString('base64');
        // Attempt text extraction for plain text / json
  if(!comments){
          try {
            if(file.type.startsWith('text/') || file.type === 'application/json'){
              const text = buff.toString('utf8');
              comments = basicSummarize(text);
        actualResult = text.slice(0, 60000);
            } else {
              comments = `Report file uploaded: ${file.name} (${buff.length} bytes)`;
            }
          } catch {
            comments = `Report file uploaded: ${file.name}`;
          }
        }
      } else {
        if(!comments) comments = '';
      }
      if(findings && !actualResult) actualResult = findings;
      data = { orderId, findings, comments, filePath, reportBase64, resultValues, actualResult };
    } else {
      // JSON fallback
      const body = await req.json();
      if(!body?.orderId) return NextResponse.json({error:'orderId required'},{status:400});
      data = body;
    }

    const created = await prisma.serviceTestReport.create({ data });
    return NextResponse.json(created);
  } catch (e:any) {
    console.error('POST /servicetestreports error', e);
    return NextResponse.json({error:'Internal server error'},{status:500});
  }
}
export async function PUT(req: Request){ 
  try { 
    const contentType = req.headers.get('content-type') || '';
    let id: number | null = null; let data: any = {};
    if(contentType.includes('multipart/form-data')){
      const fd = await req.formData();
      const idRaw = fd.get('id');
      if(!idRaw) return NextResponse.json({error:'Missing id'},{status:400});
      id = Number(idRaw); if(Number.isNaN(id)) return NextResponse.json({error:'Invalid id'},{status:400});
  const findings = (fd.get('findings')||'') as string;
  let actualResult: string | undefined = undefined;
      let comments = (fd.get('comments')||'') as string;
      const file: File | null = fd.get('reportFile') instanceof File ? fd.get('reportFile') as File : null;
      let filePath: string | undefined; let reportBase64: string | undefined;
      if(file){
        filePath = file.name;
        const buff = Buffer.from(await file.arrayBuffer());
        reportBase64 = buff.toString('base64');
  if(!comments){
          try {
            if(file.type.startsWith('text/') || file.type==='application/json'){
              const txt = buff.toString('utf8');
              comments = basicSummarize(txt);
        actualResult = txt.slice(0,60000);
            } else comments = `Report file uploaded: ${file.name} (${buff.length} bytes)`;
          } catch { comments = `Report file uploaded: ${file.name}`; }
        }
      }
      if(findings && !actualResult) actualResult = findings;
      data = { findings, comments } as any;
      if(actualResult) data.actualResult = actualResult;
      if(filePath) data.filePath = filePath;
      if(reportBase64) data.reportBase64 = reportBase64;
    } else {
      const body = await req.json();
      id = Number(body?.id); if(!id) return NextResponse.json({error:'Missing id'},{status:400});
      const { id: _remove, ...rest } = body;
      data = rest;
    }
    const updated=await prisma.serviceTestReport.update({ where:{id}, data }); 
    return NextResponse.json(updated);
  } catch (e:any) { 
    console.error('PUT /servicetestreports error', e);
    return NextResponse.json({error:'Internal server error'},{status:500});
  }
}
export async function DELETE(req: Request){ try { const body=await req.json(); const id=Number(body?.id); if(!id) return NextResponse.json({error:'Missing id'},{status:400}); await prisma.serviceTestReport.delete({ where:{id} }); return NextResponse.json({success:true}); } catch { return NextResponse.json({error:'Internal server error'},{status:500});}}
