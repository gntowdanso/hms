import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GERMINI_API_KEY;

export async function identifyImage(base64: string, mimeType: string, question: string){
  if(!GEMINI_API_KEY) return { error: 'Missing Gemini API key' };
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [ { text: question }, { inlineData: { data: base64, mimeType } } ] }
      ]
    });
    const text = result.response.text();
    return { text };
  } catch (e:any){
    return { error: e.message || 'Gemini request failed' };
  }
}