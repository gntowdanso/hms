import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // ensure Node (pdf-lib needs Node APIs)

// Note: In Next.js 15 dynamic route params may be a Promise; await before use to avoid warning.
export async function GET(_req: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
  const awaited = 'then' in (context.params as any) ? await (context.params as Promise<{ id: string }>) : (context.params as { id: string });
  const idNum = Number(awaited.id);
    if(!idNum) return NextResponse.json({ error: 'Invalid id'},{ status:400 });
    const report = await prisma.serviceTestReport.findUnique({
      where:{ id: idNum },
      include:{ serviceOrder:{ include:{ service:true, servicePackage:true, patient:true } } }
    });
    if(!report) return NextResponse.json({ error:'Not found'},{ status:404 });

  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([595.28, 841.89]); // A4
    let y = 800;

    const newPage = () => { page = pdf.addPage([595.28,841.89]); y = 800; };
    const drawLine = (text: string, size=10, color=rgb(0,0,0)) => {
      if (y < 50) newPage();
      const safe = sanitizeForWinAnsi(text);
      page.drawText(safe, { x:40, y, size, font: helv, color });
      y -= size + 4;
    };
    const section = (title: string) => { y -= 4; drawLine(title, 12, rgb(0,0.25,0.55)); y -= 2; };
    const wrap = (label: string, value?: string|null) => {
      if(!value) return;
      const safeVal = sanitizeForWinAnsi(value); // ensure encodable
      const labelTxt = sanitizeForWinAnsi(label + ': ');
      const maxWidth = 515; // 595 - margins
      const bodyWidth = maxWidth - helv.widthOfTextAtSize(labelTxt,10);
      const lines = wrapText(safeVal, helv, 10, bodyWidth).map(l=>sanitizeForWinAnsi(l));
      if(lines.length === 0) return;
      drawLine(labelTxt + lines.shift(), 10);
      const pad = ' '.repeat(labelTxt.length);
      lines.forEach(l=> drawLine(pad + l, 10));
    };

    // Title
  page.drawText(sanitizeForWinAnsi('Medical Service Report'), { x:40, y, size:18, font:helv, color: rgb(0,0.2,0.6) }); y -= 32;

    section('Meta');
    wrap('Report ID', String(report.id));
    wrap('Order ID', String(report.orderId));
    wrap('Patient', report.serviceOrder?.patient ? `${report.serviceOrder.patient.firstName} ${report.serviceOrder.patient.lastName}` : '');
    wrap('Service', report.serviceOrder?.service?.serviceName || report.serviceOrder?.servicePackage?.packageName || '');
    wrap('Report Date', (report.reportDate instanceof Date ? report.reportDate.toISOString() : new Date(report.reportDate as any).toISOString()));
    wrap('AI Provider', report.aiProvider || '');

    section('Actual Result');
    if(report.actualResult){
      const parsed = parseLabReport(report.actualResult);
      if(parsed && parsed.sections.length){
        for(const sec of parsed.sections){
          drawLine(sanitizeForWinAnsi(sec.title), 11, rgb(0.15,0.15,0.5));
          y -= 2;
          if(sec.rows.length){
            y = drawTable(sec.headers, sec.rows, { y, page, pdf, helv, helvBold, newPageFn: ()=>{ newPage(); page = pdf.getPages()[pdf.getPageCount()-1]; }, marginX:40 });
            y -= 6;
          }
        }
        if(parsed.doctorComments){
          drawLine('Doctor\'s Comments', 11, rgb(0.15,0.15,0.5));
          const commentLines = wrapText(sanitizeForWinAnsi(parsed.doctorComments), helv, 10, 515);
          commentLines.forEach(cl=> drawLine(cl,10));
        }
      } else {
        wrap('Actual Result', report.actualResult);
      }
    }

    section('Findings');
    wrap('Findings', report.findings || '');

    section('Comments');
    wrap('Comments', report.comments || '');

    section('AI Summary');
    wrap('AI Summary', report.aiSummary || '');

    const bytes = await pdf.save();
    return new Response(Buffer.from(bytes), {
      status:200,
      headers:{
        'Content-Type':'application/pdf',
        'Content-Disposition':`inline; filename="report-${report.id}.pdf"`
      }
    });
  } catch (e:any) {
    console.error('PDF generation error', e);
    if(process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error:'Failed to generate PDF', detail: e?.message || String(e) }, { status:500 });
    }
    return NextResponse.json({ error:'Failed to generate PDF'},{ status:500 });
  }
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  if(!text) return [];
  const safeText = sanitizeForWinAnsi(text);
  const words = safeText.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const rawWord of words) {
    const w = sanitizeForWinAnsi(rawWord); // double safety
    const tentative = current ? current + ' ' + w : w;
    const wWidth = font.widthOfTextAtSize(tentative, size);
    if (wWidth > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = tentative;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Replace characters not encodable in WinAnsi (like Greek micro sign) with approximate ASCII
function sanitizeForWinAnsi(input: string): string {
  return input
    .replace(/[\u00B5\u03BC]/g, 'u') // micro sign / Greek mu -> 'u'
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes
    .replace(/[\u201C\u201D]/g, '"') // curly double quotes
    .replace(/\u2013|\u2014/g, '-')   // en/em dash -> hyphen
    .replace(/\u00A0/g, ' ');         // non-breaking space
}

// --- Lab report parsing (heuristic) ---
interface ParsedSection { title: string; headers: string[]; rows: string[][]; }
interface ParsedLabReport { sections: ParsedSection[]; doctorComments?: string }

function parseLabReport(raw: string): ParsedLabReport | null {
  const text = raw.replace(/\r/g,'').trim();
  if(!text) return null;
  const lines = text.split(/\n+/).map(l=>l.trim()).filter(Boolean);
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  const headerKeywords = ['Test','Parameter'];
  const doctorIdx = lines.findIndex(l=>/doctor['’]s comments/i.test(l));
  let doctorComments: string | undefined;
  const effectiveLines = doctorIdx >=0 ? lines.slice(0,doctorIdx) : lines;
  if(doctorIdx>=0){ doctorComments = lines.slice(doctorIdx+1).join(' '); }

  for(const line of effectiveLines){
    // Section title heuristic: capitalized words followed by 'Test' or ends with 'Analysis'
    if(/^[A-Z][A-Za-z\s]+$/.test(line) || /(Test|Analysis)$/i.test(line)){ 
      if(current) sections.push(current);
      current = { title: line, headers: [], rows: [] };
      continue;
    }
    if(!current){
      current = { title: 'General', headers: [], rows: [] };
    }
    // Detect header row
    if(!current.headers.length && headerKeywords.some(k=> line.toLowerCase().includes(k.toLowerCase()))){
      current.headers = tokenizeCells(line);
      continue;
    }
    const cells = tokenizeCells(line);
    if(cells.length > 1){
      if(!current.headers.length){
        // synthesize headers
        current.headers = ['Name','Value','Reference','Remarks'].slice(0,cells.length);
      }
      current.rows.push(cells);
    } else {
      // append to last row remarks if possible
      if(current.rows.length){
        current.rows[current.rows.length-1][current.rows[current.rows.length-1].length-1]+= ' ' + line;
      }
    }
  }
  if(current) sections.push(current);
  return { sections, doctorComments };
}

function tokenizeCells(line: string): string[] {
  // Split by two or more spaces or a tab
  const parts = line.split(/\s{2,}|\t+/).map(p=>p.trim()).filter(Boolean);
  if(parts.length <=1){
    // fallback: try single space split but limit to 4 cells
    const sp = line.split(/\s+/).filter(Boolean);
    if(sp.length>4){
      return [sp.slice(0,sp.length-3).join(' '), sp[sp.length-3], sp[sp.length-2], sp[sp.length-1]];
    }
    return sp;
  }
  return parts;
}

interface DrawTableOpts { y: number; page: any; pdf: PDFDocument; helv: any; helvBold: any; newPageFn: () => void; marginX: number }

// Advanced table renderer with fixed headers [Name, Value, Reference, Remarks]
function drawTable(headers: string[], rows: string[][], opts: DrawTableOpts): number {
  const { helv, helvBold, marginX } = opts;
  let { y } = opts;
  const sizeHeader = 10; const sizeCell = 9; const lineGap = 3;
  const maxWidth = 595.28 - marginX*2;
  // Fixed column ratio (must sum ~1)
  const ratios = [0.30, 0.18, 0.20, 0.32];
  const colWidths = ratios.map(r=> r * maxWidth);
  const safeHeaders = ['Name','Value','Reference','Remarks'];

  // Normalize rows: ensure exactly 4 cols; merge extras into Remarks
  const normRows = rows.map(r=>{
    const copy = [...r];
    if(copy.length < 4){ while(copy.length<4) copy.push(''); }
    if(copy.length > 4){
      const merged = copy.slice(3).join(' ');
      copy[3] = (copy[3] ? copy[3] + ' ' : '') + merged;
      copy.length = 4;
    }
    return copy.map(c=> sanitizeForWinAnsi(c||''));
  });

  const drawCellLines = (text:string, width:number, font:any, size:number): string[] => {
    if(!text) return [''];
    return wrapText(text, font, size, width - 2); // small inner padding
  };

  const ensureSpace = (needed:number) => { if(y - needed < 50){ opts.newPageFn(); y = opts.y = 800; } };

  // Header background (simple underline)
  const drawHeader = () => {
    ensureSpace(sizeHeader + 8);
    let x = marginX;
    for(let i=0;i<safeHeaders.length;i++){
      const txt = safeHeaders[i];
      opts.page.drawText(txt, { x: x+1, y, size: sizeHeader, font: helvBold });
      x += colWidths[i];
    }
    y -= sizeHeader + 4;
    // underline
    opts.page.drawLine({ start:{ x: marginX, y: y+2 }, end:{ x: marginX + maxWidth, y: y+2 }, thickness: 0.5, color: rgb(0.7,0.7,0.7) });
  };

  drawHeader();
  for(const row of normRows){
    // wrap each cell
    const cellLines: string[][] = row.map((c,i)=> drawCellLines(c, colWidths[i], helv, sizeCell));
    const rowHeightLines = Math.max(...cellLines.map(cl=> cl.length));
    const rowPixelHeight = rowHeightLines * (sizeCell + lineGap) - lineGap + 4; // plus bottom padding
    ensureSpace(rowPixelHeight);
    for(let lineIdx=0; lineIdx<rowHeightLines; lineIdx++){
      let x = marginX;
      for(let col=0; col<colWidths.length; col++){
        const lines = cellLines[col];
        const txt = lines[lineIdx] ?? '';
        opts.page.drawText(txt, { x: x+1, y, size: sizeCell, font: helv });
        x += colWidths[col];
      }
      y -= sizeCell + lineGap;
    }
    y -= 2; // extra spacing between rows
  }
  return y;
}
