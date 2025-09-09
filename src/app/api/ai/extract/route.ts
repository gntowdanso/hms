import { NextResponse } from 'next/server';
import { identifyImage } from '@/lib/geminiImage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request){
  try {
    const ct = req.headers.get('content-type') || '';
    let base64 = '';
    let mimeType = '';
    if(ct.includes('application/json')){
      const body = await req.json();
      base64 = body?.base64 || '';
      mimeType = body?.mimeType || '';
    } else if(ct.includes('multipart/form-data')){
      const fd = await req.formData();
      const f = fd.get('file');
      if(f instanceof File){
        mimeType = f.type;
        const buf = Buffer.from(await f.arrayBuffer());
        base64 = buf.toString('base64');
      }
    }
    if(!base64 || !mimeType) return NextResponse.json({error:'Missing base64 or mimeType'}, {status:400});
    // Use Gemini to extract raw text only
    const prompt = 'Extract and return ONLY the raw textual content present in this medical or lab report image. Do not add interpretation.';
    const result = await identifyImage(base64, mimeType, prompt);
    if('error' in result) return NextResponse.json(result, {status:500});
    // Basic cleanup: strip potential markdown fences
    const text = (result.text || '').replace(/```[a-z]*|```/gi,'').trim();
    return NextResponse.json({ text });
  } catch (e:any){
    return NextResponse.json({error:'Extraction failed'}, {status:500});
  }
}