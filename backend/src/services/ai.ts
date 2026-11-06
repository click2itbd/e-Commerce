import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

function getAiClient(): GoogleGenAI {
  let key = process.env.GEMINI_API_KEY;
  if (!key) {
    dotenv.config({ path: path.join(process.cwd(), '.env') });
    dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
    key = process.env.GEMINI_API_KEY;
  }
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function generateChatResponse(message: string): Promise<string> {
  const client = getAiClient();

  if (!message || typeof message !== 'string' || message.length > 100000) {
    throw new Error('Message is required and must be under 2000 characters');
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message
    });
    return response.text || '';
  } catch (error: any) {
    console.error('AI chat error with primary model, trying fallback:', error.message);
    try {
      const fallbackResponse = await client.models.generateContent({
        model: 'gemini-flash-latest',
        contents: message
      });
      return fallbackResponse.text || '';
    } catch (fallbackError: any) {
      console.error('AI chat fallback error:', fallbackError.message);
      throw new Error('AI service error');
    }
  }
}

export async function polishText(
  text: string,
  options?: {
    context?: 'product_name' | 'description' | 'notes' | 'quotation' | 'general';
    targetLang?: 'auto' | 'bangla' | 'english' | 'banglish_to_bangla';
  }
): Promise<string> {
  const client = getAiClient();

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  const context = options?.context || 'general';
  const targetLang = options?.targetLang || 'english';

  const systemInstruction = `You are an expert bilingual AI editor and translator for an e-Commerce and Business ERP system.
Your mission is to convert the user's input text into FLAWLESS, PROFESSIONAL ENGLISH, no matter what language or form the input was written in!

CRITICAL TRANSLATION & POLISHING RULES:
1. Input Variety & Translation to English:
   - Banglish / Phonetic Bengali (e.g. "ei product ta khub bhalo", "1 bochor warrenty ache", "kono problem nai", "delivary shomoy taka dibe") -> MUST BE CONVERTED INTO NATURAL, GRAMMATICALLY CORRECT ENGLISH (e.g. "This product is high quality", "Includes 1 year warranty", "No issues", "Payment upon delivery").
   - Broken or misspelled Banglish (e.g. "valo kory pac king korben", "custmer taka pore debey", "akta monitor lagbe fast delivery chai") -> Fix the meaning, eliminate misspellings, and convert into clean, standard English (e.g. "Please pack securely", "Customer will pay the remaining balance later", "Need a monitor with express delivery").
   - Bengali script (বাংলা) (e.g. "১ বছরের অফিশিয়াল ওয়ারেন্টি সহ নতুন মনিটর", "কুরিয়ার সার্ভিসের মাধ্যমে পাঠানো হবে") -> MUST BE CONVERTED INTO ACCURATE, PROFESSIONAL ENGLISH (e.g. "Brand new monitor with 1-year official warranty", "Will be dispatched via courier service").
   - Misspelled or broken English (e.g. "samsng moniter with 3 year warenty", "invoce for spaczero ltd", "discription of laptop") -> Correct all typos, fix grammar, and elevate to clean, professional business English (e.g. "Samsung Monitor with 3 Years Warranty", "Invoice for Spacezero Ltd", "Laptop Description").
   - Mixed text (Bangla + English + Banglish) -> Seamlessly unify into fluent, standard English.

2. Context-Specific Guidelines:
   - 'product_name': Clean Title Case, concise, professional e-commerce product title. Ensure tech brand names (e.g. Asus, HP, Dell, Samsung, Maxline, Apple, Lenovo, Logitech, Gigabyte, MSI, TP-Link) and specifications (e.g. 24-Inch, 16GB DDR4, 512GB NVMe SSD, Full HD, IPS, 65W, USB-C, Wi-Fi) are formatted with correct casing and units. Example: "asus er 24 inc ips led moniter 3 bochor warenty" -> "Asus 24-Inch Full HD IPS LED Monitor with 3 Years Warranty".
   - 'description': Clear, engaging, and professional product description. Fix formatting, technical specifications, and bullet readability.
   - 'notes': Polite, concise, and clear business communication for invoice or delivery notes (e.g. input: "courier e pathaben jano venge na jai" -> output: "Please dispatch via courier and handle with care to prevent damage.").
   - 'quotation': Formal business terms and conditions for corporate quotation.
   - 'general': Natural, concise, and grammatically perfect English.

3. Language Rule:
   - If targetLang is explicitly 'bangla', convert/polish to standard formal Bengali script (বাংলা).
   - IN ALL OTHER CASES (default 'english' or 'auto'), the output MUST ALWAYS BE IN ENGLISH!

4. Formatting & Constraints:
   - Return ONLY the final polished English text.
   - DO NOT include conversational filler, greetings, markdown labels (e.g. DO NOT say "Here is the English version:"), or wrap quotes around the whole text.
   - Accurately preserve numbers, model numbers, dimensions, and prices (e.g. ML-844-5, 5m, BDT 5,000, 3200MHz).`;

  try {
    let responseText = '';
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nContext: ${context}\nTarget Language: ${targetLang}\n\nOriginal Text:\n${text}` }
            ]
          }
        ]
      });
      responseText = response.text || '';
    } catch (err: any) {
      console.warn('AI polish error on gemini-3.8-flash, trying fallback:', err.message);
      const fallbackResponse = await client.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nContext: ${context}\nTarget Language: ${targetLang}\n\nOriginal Text:\n${text}` }
            ]
          }
        ]
      });
      responseText = fallbackResponse.text || '';
    }

    let polished = responseText.trim();
    if (polished.startsWith('"') && polished.endsWith('"') && polished.length > 2) {
      polished = polished.slice(1, -1).trim();
    }
    return polished || text;
  } catch (error: any) {
    console.error('AI polish error:', error.message);
    throw new Error(error.message || 'AI polish error');
  }
}
