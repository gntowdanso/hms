import { NextResponse } from 'next/server';
import { summarizeClinicalReport } from '@/lib/aiSummarize';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(()=>({}));
  const text: string = body?.text || '';
  const reportId: number | undefined = body?.reportId ? Number(body.reportId) : undefined;
    if(!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    const result = await summarizeClinicalReport(text);
    if(reportId){
      try {
        await prisma.serviceTestReport.update({ where:{ id: reportId }, data:{ aiSummary: result.summary, aiProvider: result.provider, aiInputHash: result.hash } });
      } catch {}
    }
    return NextResponse.json(result);
  } catch (e:any) {
    return NextResponse.json({ error: 'AI summary failed' }, { status: 500 });
  }
}
