// Placeholder for PDF generation. To enable real PDF export, install 'jspdf' or 'pdf-lib'.
// This stub returns structured text content that a client utility can convert to PDF.
export interface MedicalReportPDFOptions {
  patientName?: string;
  orderId?: number;
  serviceName?: string;
  actualResult?: string;
  findings?: string;
  comments?: string;
  aiSummary?: string;
}

export function buildMedicalReportContent(opts: MedicalReportPDFOptions){
  const lines: string[] = [];
  lines.push('Medical Service Report');
  const add = (label: string, val?: string) => { if(val) lines.push(`${label}: ${val}`); };
  add('Patient', opts.patientName);
  add('Order ID', opts.orderId? String(opts.orderId): undefined);
  add('Service', opts.serviceName);
  add('AI Summary', opts.aiSummary);
  add('Findings', opts.findings);
  add('Comments', opts.comments);
  add('Actual Result (Raw Extract)', opts.actualResult);
  return lines.join('\n');
}
