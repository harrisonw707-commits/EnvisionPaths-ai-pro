// AI Service calling Gemini directly from the frontend
// AI Service calling backend API (server handles Gemini)

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY


import { GoogleGenAI, Modality } from "@google/genai";

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY
// We use a fallback to an empty string if the key is not set, 
// as the platform's proxy will handle the actual authentication.
const getAi = () => {
  // Check both standard and Vite-prefixed environment variables
  // The platform might inject GEMINI_API_KEY or API_KEY
  // We prioritize non-empty strings
  const apiKey = 
    (window as any).GEMINI_API_KEY ||
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'undefined' ? process.env.GEMINI_API_KEY : '') || 
    (process.env.API_KEY && process.env.API_KEY !== 'undefined' ? process.env.API_KEY : '') || 
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_API_KEY ||
    '';
  
  if (!apiKey || apiKey === 'undefined') {
    console.error("CRITICAL: Gemini API Key is missing or invalid. Please ensure GEMINI_API_KEY or API_KEY is set in the environment.");
  }
  
  return new GoogleGenAI({ apiKey: apiKey as string });
};

export interface AIResponse {
  text: string;
}

export async function* generateAIStream(prompt: string): AsyncGenerator<string> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("AI Streaming Error:", error);
    throw error;
  }
}

export async function generateAI(prompt: string): Promise<AIResponse> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    return { text: response.text || "" };
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

    return { text: response.text || "" };
  } catch (error) {
    console.error("AI Content Generation Error:", error);
    throw error;
  }
}

export async function generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this with natural human-like intonation, pausing for emphasis where appropriate, as a professional career coach: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
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

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string | null> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            {
              text: "Transcribe the audio exactly as spoken. If there is no speech, return an empty string. Only return the transcription, nothing else.",
            },
          ],
        },
      ],
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Transcription Error:", error);
    return null;
  }
}

 
       
   
 
   

