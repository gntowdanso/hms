import { summarizeWithGrok } from './grok';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

const GEMINI_API_KEY = process.env.GERMINI_API_KEY; // as provided in .env (typo intentionally preserved)

interface ProviderResult { summary: string | null; error?: string; provider: 'gemini' | 'grok'; cached?: boolean; hash?: string; }

async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function summarizeWithGemini(rawText: string): Promise<ProviderResult> 
{
  if(!GEMINI_API_KEY) return { summary: null, error: 'Gemini missing key', provider: 'gemini' };
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const text = rawText.slice(0, 12000);
  const prompt = `You are a clinical report Extractor. Extract the following medical service test report in  concise sentences focusing on: key findings, abnormal values, noteworthy negatives, and recommended follow-up. Use neutral clinical language and avoid speculation.\n\nReport Text:\n${text}`;

  const attempt = async (): Promise<ProviderResult> => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 280 }
        })
      });
      if(!res.ok){
        // Parse JSON error if available for cleaner messaging
        let errTxt = await res.text().catch(()=>res.statusText);
        return { summary: null, error: `HTTP ${res.status} ${errTxt.slice(0,180)}`, provider: 'gemini' };
      }
      const data: any = await res.json();
      const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if(!summary) return { summary: null, error: 'Gemini empty response', provider: 'gemini' };
      return { summary, provider: 'gemini' };
    } catch (e:any) {
      return { summary: null, error: e?.message || 'Gemini exception', provider: 'gemini' };
    }
  };

  // Retry up to 2 times on transient errors (503 / 429)
  let last: ProviderResult = { summary: null, error: 'Not attempted', provider: 'gemini' };
  for(let i=0;i<3;i++){
    last = await attempt();
    if(last.summary) return last;
    if(last.error && /(429|503|rate|timeout)/i.test(last.error)){ await sleep(300 + i*600); continue; }
    break; // non-retryable
  }
  return last; // failed
}

// Combined summarizer: tries Gemini first, then Grok fallback
export async function summarizeClinicalReport(raw: string): Promise<{ summary: string; provider: string; fallback?: string; cached?: boolean; hash: string; geminiError?: string; grokError?: string }>{
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0,40);
  // Check cache
  const cached = await prisma.aISummaryCache.findUnique({ where:{ inputHash: hash } }).catch(()=>null);
  if(cached) return { summary: cached.summary, provider: cached.provider, hash, cached: true };

  const gemini = await summarizeWithGemini(raw);
  if(gemini.summary){
    await prisma.aISummaryCache.create({ data:{ inputHash: hash, provider:'gemini', summary: gemini.summary } }).catch(()=>{});
    return { summary: gemini.summary, provider: 'gemini', hash };
  }

  const grokSummary = await summarizeWithGrok(raw);
  const grokFailed = /unavailable|error|failed/i.test(grokSummary);
  if(!grokFailed && grokSummary && !grokSummary.startsWith('AI returned empty')){
    await prisma.aISummaryCache.create({ data:{ inputHash: hash, provider:'grok', summary: grokSummary } }).catch(()=>{});
    return { summary: grokSummary, provider: 'grok', fallback: gemini.error, hash, geminiError: gemini.error };
  }
  // Both failed; provide clean generic summary rather than raw error text
  return { summary: 'All AI providers failed.', provider: 'none', fallback: grokSummary, hash, geminiError: gemini.error, grokError: grokSummary };
}
