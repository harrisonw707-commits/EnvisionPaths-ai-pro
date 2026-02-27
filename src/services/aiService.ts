import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize with the platform-provided key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content");
  }
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
