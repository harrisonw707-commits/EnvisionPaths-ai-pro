// AI Service calling Gemini directly from the frontend
// AI Service calling backend API (server handles Gemini)

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY


import { GoogleGenAI, Modality } from "@google/genai";

function getAi() {
  const key = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey: key });
}

export interface AIResponse {
  text: string;
}

export async function generateAI(prompt: string): Promise<AIResponse> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("No text returned from AI");
    }

    return { text: response.text };
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function generateContent(messageText: string, systemInstruction: string, history: any[]): Promise<AIResponse> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: messageText }] }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    if (!response.text) {
      throw new Error("No text returned from AI");
    }

    return { text: response.text };
  } catch (error) {
    console.error("AI Content Generation Error:", error);
    throw error;
  }
}

export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const ai = getAi();
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
    console.error("TTS Generation Error:", error);
    return null;
  }
}

 
       
   
 
   

