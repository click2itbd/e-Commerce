import { GoogleGenAI } from '@google/genai';

const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function generateChatResponse(message: string): Promise<string> {
  if (!aiClient) {
    throw new Error('AI service is not configured');
  }

  if (!message || typeof message !== 'string' || message.length > 100000) {
    throw new Error('Message is required and must be under 2000 characters');
  }

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message
    });
    return response.text || '';
  } catch (error: any) {
    console.error('AI chat error:', error.message);
    throw new Error('AI service error');
  }
}

export async function polishText(
  text: string,
  options?: {
    context?: 'product_name' | 'description' | 'notes' | 'quotation' | 'general';
    targetLang?: 'auto' | 'bangla' | 'english' | 'banglish_to_bangla';
  }
): Promise<string> {
  if (!aiClient) {
    throw new Error('AI service is not configured');
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  const context = options?.context || 'general';
  const targetLang = options?.targetLang || 'auto';

  const systemInstruction = `You are an expert bilingual proofreader and content editor for an e-Commerce and Business ERP system.
Your mission is to polish the provided user input text by correcting typos, grammatical mistakes, broken sentences, improper capitalization, and formatting errors.

Support:
- English: Proper grammar, capitalization of brand/tech names (e.g. "Samsung", "Intel Core i5", "GB", "SSD", "RAM", "NVMe"), professional business tone.
- Bengali / বাংলা: Correct spelling, proper punctuation, remove sadhu-cholito mixture.
- Banglish / phonetic Bengali (e.g. "kono problem nai", "ei product ta khub bhalo", "1 bochor warrenty ache"):
  ${targetLang === 'banglish_to_bangla' ? 'Convert it into natural, grammatically correct, formal Bengali script (বাংলা).' : 'Convert or clean into natural, standard Bengali (বাংলা) or professional English according to the business context.'}

Context specifics:
- 'product_name': Keep it clean, standard Title Case, proper model/brand capitalization (e.g., "Maxline 4-Port Multi-Extension Socket 5m Wire"), remove gibberish or redundant filler words.
- 'description': Clear sentences, correct product specifications, bullet-friendly formatting if multi-line.
- 'notes' / 'quotation': Formal, polite business invoice/quotation tone with correct terms and punctuation.

CRITICAL RULES:
1. Return ONLY the polished final text.
2. DO NOT include greetings, intro, markdown block labels (like "Here is the polished text:"), quotes around the entire response, or explanations.
3. Preserve numbers, prices, model numbers, and technical specifications accurately.`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemInstruction}\n\nContext: ${context}\nTarget Language: ${targetLang}\n\nOriginal Text:\n${text}` }
          ]
        }
      ]
    });
    let polished = (response.text || '').trim();
    if (polished.startsWith('"') && polished.endsWith('"') && polished.length > 2) {
      polished = polished.slice(1, -1).trim();
    }
    return polished || text;
  } catch (error: any) {
    console.error('AI polish error:', error.message);
    throw new Error(error.message || 'AI polish error');
  }
}
