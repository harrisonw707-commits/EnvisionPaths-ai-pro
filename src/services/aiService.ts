import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Initialize with the platform-provided key
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}
/**
 * Helper to get the AI instance with the current API key.
 */
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'dummy-key' || apiKey === 'undefined') {
    console.error("[AI] API Key Check Failed:", { 
      exists: !!apiKey, 
      isDummy: apiKey === 'dummy-key',
      isUndefinedString: apiKey === 'undefined'
    });
    throw new Error("Gemini API Key is missing or invalid. Please check your settings in the AI Studio menu.");
  }
  
  // Log masked key for debugging
  console.log(`[AI] Using API Key starting with: ${apiKey.substring(0, 4)}...`);
  
  return new GoogleGenAI({ apiKey });
}

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
      const ai = getAI();
      const modelName = "gemini-3-flash-preview";
      console.log(`[AI] Attempting generation with ${modelName} (Retries: ${retries - 1})`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...history,
          { role: "user", parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      
      if (!response.text) {
        throw new Error("Gemini returned an empty response (possibly blocked by safety filters or empty output).");
      }

      return {
        text: response.text,
      };
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message?.toLowerCase() || "";
      console.error(`[AI] Error during generation:`, error);
      
      if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
        return { text: "I apologize, but I cannot respond to that request as it triggers my safety filters. Let's try a different interview topic." };
      }
      
      retries--;
      if (retries > 0) {
        const delay = (4 - retries) * 1500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  const finalErrorMessage = lastError?.message || "Unknown API error";
  console.error("[AI] All retries failed. Final error:", finalErrorMessage);
  throw new Error(`AI Error: ${finalErrorMessage}. Please try again in a moment.`);
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
    const ai = getAI();
    const modelName = "gemini-3-flash-preview";
    console.log(`[AI] Streaming with ${modelName}`);

    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });
    
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error: any) {
    console.error("[AI] Streaming Error:", error);
    const errorMsg = error.message?.toLowerCase() || "";
    if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
      onChunk("I apologize, but I cannot respond to that request as it triggers my safety filters.");
    } else {
      throw new Error(`Streaming Error: ${error.message || "Unknown error"}`);
    }
  }
}

/**
 * Generates speech from text using Gemini TTS.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const ai = getAI();
    console.log(`[TTS] Generating speech for text: "${text.substring(0, 30)}..."`);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say in a professional, clear, and encouraging tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    console.log(`[TTS] Speech generated. Audio data length: ${base64Audio?.length || 0}`);
    return base64Audio || null;
  } catch (error) {
    console.error("[TTS] Gemini TTS Error:", error);
    return null;
  }
}
