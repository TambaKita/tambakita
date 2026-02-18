
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly in the initialization within functions.
// Removed top-level API_KEY constant to avoid potential stale key issues.

export const analyzePondHealth = async (pondData: any) => {
  // Fix: Create a new instance right before the call and use process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analisis kondisi budidaya perikanan berdasarkan standar teknis (pH ideal 6.5-8.5, Suhu 26-30°C, DO >5 mg/L, Amonia <0.1 ppm):
    Data Saat Ini:
    - pH: ${pondData.ph}
    - Suhu: ${pondData.temp}°C
    - Amonia: ${pondData.ammonia} ppm
    - DO: ${pondData.do} mg/L
    
    Berikan evaluasi risiko (Low/Medium/High) dan tindakan korektif mendesak jika parameter di luar batas aman.
    Format respons harus berupa JSON dengan field: "risk" (Low/Medium/High), "summary" (singkat & padat), "actions" (array langkah praktis).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk: { type: Type.STRING },
            summary: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["risk", "summary", "actions"]
        }
      }
    });
    // Fix: access .text directly.
    return response.text ? JSON.parse(response.text.trim()) : null;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
};

export const chatWithAI = async (history: any[], message: string) => {
  // Fix: Create a new instance right before the call and use process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'Anda adalah pakar akuakultur senior TambaKita. Gunakan bahasa Indonesia yang profesional namun mudah dimengerti petambak. Fokus pada solusi teknis perikanan standar nasional.',
    },
  });

  const result = await chat.sendMessage({ message });
  // Fix: Access .text property directly.
  return result.text;
};
