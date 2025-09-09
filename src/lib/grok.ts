// Grok (xAI) summarization helper.
// NOTE: Adjust endpoint/model if different in your account; keep key only on server.

const GROK_API_KEY = process.env.GROP_API_KEY; // key stored in .env (do not expose to client)

interface GrokChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  output?: string;
}

export async function summarizeWithGrok(rawText: string, signal?: AbortSignal): Promise<string> {
  if(!GROK_API_KEY) return 'AI summary unavailable (missing API key).';
  const text = rawText.slice(0, 8000); // trim to safe length
  const systemPrompt = 'You are a medical report summarizer. Produce a concise clinical summary (4-6 sentences) highlighting key findings, abnormalities, and recommended next steps. Avoid speculation.';
  try {
    // Placeholder endpoint & payload structure; adjust if Grok API differs.
    const resp = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
            { role: 'user', content: `Summarize this medical service test report text:\n\n${text}` }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
      signal
    });
    if(!resp.ok){
      const t = await resp.text().catch(()=>resp.statusText);
      return `AI summary error: ${t.slice(0,140)}`;
    }
    const data: GrokChatResponse = await resp.json();
    const fromChoices = data.choices?.[0]?.message?.content?.trim();
    const out = fromChoices || (data as any).output || '';
    return out || 'AI returned empty summary.';
  } catch (e:any) {
    return `AI summary failed: ${e.message || 'unknown error'}`;
  }
}
