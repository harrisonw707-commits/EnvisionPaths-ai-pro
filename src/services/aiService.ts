import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function generateContent(prompt: string, systemInstruction?: string, history: any[] = []): Promise<AIResponse> {
  const contents = history.length > 0 
    ? [...history, { role: 'user', parts: [{ text: prompt }] }] 
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction,
    },
  });
  return { text: response.text || "" };
}

export async function streamContent(prompt: string, onChunk: (chunk: string) => void, systemInstruction?: string, history: any[] = []) {
  const contents = history.length > 0 
    ? [...history, { role: 'user', parts: [{ text: prompt }] }] 
    : [{ role: 'user', parts: [{ text: prompt }] }];

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction,
    },
  });

  let fullText = "";
  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
}

export async function generateSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return base64Audio;
  }
  throw new Error("Failed to generate speech");
}

export async function generateAI(prompt: string) {
  return generateContent(prompt);
}

export interface AIResponse {
  text: string;
}

/**
 * Generic retry helper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  onRetry?: (error: any, attempt: number) => void
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || "";
      
      // Don't retry if it's a safety block or quota error (429)
      if (errorMsg.includes('safety') || errorMsg.includes('blocked') || errorMsg.includes('429') || errorMsg.includes('quota')) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        if (onRetry) onRetry(error, attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
 
   throw lastError;
}
       
   
 
   

