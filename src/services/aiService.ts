// AI Service calling Gemini directly from the frontend
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

/**
 * Generates content using Gemini directly.
 */
export async function generateContent(
  prompt: string, 
  systemInstruction?: string,
  history: any[] = []
): Promise<AIResponse> {
  try {
    return await withRetry(async () => {
      const modelName = "gemini-3-flash-preview";
      console.log(`[AI] Generating content directly with ${modelName}`);
      
      const ai = getAI();
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...history,
          { role: "user", parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text;
      
      if (text === undefined) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          return { text: "I apologize, but I cannot respond to that request as it triggers my safety filters. Let's try a different interview topic." };
        }
        throw new Error(`Gemini returned an empty response. Finish reason: ${finishReason}`);
      }

      return { text };
    }, 3, 2000, (err, attempt) => {
      console.warn(`[AI] Retry attempt ${attempt} due to error:`, err.message);
    });
  } catch (error: any) {
    const errorMsg = error.message?.toLowerCase() || "";
    console.error(`[AI] Final error during generation:`, error);
    
    if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
      return { text: "I apologize, but I cannot respond to that request as it triggers my safety filters. Let's try a different interview topic." };
    }
    
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      throw new Error("AI service is currently busy (quota exceeded). Please wait a moment before trying again.");
    }

    if (errorMsg.includes('api key not valid')) {
      throw new Error("Gemini API Key is invalid or not configured. Please check your AI Studio settings.");
    }

    throw new Error(`AI Error: ${error.message || "Unknown error"}. Please check your connection and try again.`);
  }
}

/**
 * Streams content using Gemini directly.
 */
export async function streamContent(
  prompt: string,
  onChunk: (chunk: string) => void,
  systemInstruction?: string,
  history: any[] = []
): Promise<void> {
  try {
    const ai = getAI();
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error: any) {
    console.error("[AI] Streaming Error:", error);
    const errorMsg = error.message?.toLowerCase() || "";
    if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
      onChunk("I apologize, but I cannot respond to that request as it triggers my safety filters.");
    } else {
      throw error;
    }
  }
}

/**
 * Generates speech from text using Gemini directly.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    return await withRetry(async () => {
      const modelName = "gemini-2.5-flash-preview-tts";
      console.log(`[TTS] Generating speech directly with ${modelName}`);
      
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: modelName,
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
      return base64Audio || null;
    }, 2, 1000);
  } catch (error) {
    console.error("[TTS] Gemini TTS Error:", error);
    return null;
  }
}

/**
 * Generates an image using Gemini directly.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  try {
    return await withRetry(async () => {
      const modelName = "gemini-3.1-flash-image-preview";
      console.log(`[Image] Generating image directly with ${modelName}`);
      
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    }, 2, 2000);
  } catch (error) {
    console.error("[Image] Gemini Image Error:", error);
    return null;
  }
}

/**
 * Generates a video using Gemini directly.
 */
export async function generateVideo(prompt: string): Promise<string | null> {
  try {
    // Check for API key selection if using Veo models
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    return await withRetry(async () => {
      const modelName = "veo-3.1-fast-generate-preview";
      console.log(`[Video] Generating video directly with ${modelName}`);
      
      const ai = getAI();
      let operation = await ai.models.generateVideos({
        model: modelName,
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '1:1'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    }, 1, 1000);
  } catch (error) {
    console.error("[Video] Gemini Video Error:", error);
    return null;
  }
}
