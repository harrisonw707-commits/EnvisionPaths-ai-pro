import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Initialize with the platform-provided key
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy-key' });

export interface AIResponse {
  text: string;
}

/**
 * Generates content using the Gemini model.
 */
export async function generateContent(
  prompt: string, 
  systemInstruction?: string,
  history: any[] = []
): Promise<AIResponse> {
  let retries = 3;
  let lastError: any;

  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: "user", parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });
      
      return {
        text: response.text || "No response generated.",
      };
    } catch (error) {
      console.error(`Gemini API Error (Retries left: ${retries - 1}):`, error);
      lastError = error;
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries))); // Exponential backoff
      }
    }
  }
  
  throw new Error("Failed to generate content after multiple attempts. Please check your connection or try again later.");
}

/**
 * Streams content using the Gemini model.
 */
export async function streamContent(
  prompt: string,
  onChunk: (chunk: string) => void,
  systemInstruction?: string,
  history: any[] = []
): Promise<void> {
  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });
    
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw new Error("Failed to stream content");
  }
}

/**
 * Generates speech from text using Gemini TTS.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
}
