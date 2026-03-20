import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// AI Service using @google/genai SDK directly in the frontend
export interface AIResponse {
  text: string;
}

const API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Generates content using the Gemini model via the @google/genai SDK.
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
      if (!API_KEY) {
        throw new Error("Gemini API Key is not configured in the frontend.");
      }

      const ai = new GoogleGenAI({ apiKey: API_KEY });
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
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE }
          ],
          temperature: 0.7,
        }
      });

      const text = response.text;
      
      if (!text) {
        console.warn("[AI] Empty response from SDK:", JSON.stringify(response));
        throw new Error("Gemini returned an empty response (possibly empty output).");
      }

      return {
        text: text,
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
 * Streams content using the Gemini model via backend proxy.
 * Note: Real streaming through proxy requires SSE or similar, 
 * but for now we'll simulate it for compatibility.
 */
export async function streamContent(
  prompt: string,
  onChunk: (chunk: string) => void,
  systemInstruction?: string,
  history: any[] = []
): Promise<void> {
  try {
    const result = await generateContent(prompt, systemInstruction, history);
    onChunk(result.text);
  } catch (error: any) {
    console.error("[AI] Streaming Error:", error);
    throw error;
  }
}

/**
 * Generates speech from text using Gemini TTS via the @google/genai SDK.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    if (!API_KEY) return null;
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const modelName = "gemini-2.5-flash-preview-tts";
    console.log(`[TTS] Generating speech for: "${text.substring(0, 30)}..."`);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: `Say in a professional, clear, and encouraging tone: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("[TTS] Gemini TTS Error:", error);
    return null;
  }
}

/**
 * Generates an image using Gemini via the @google/genai SDK.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  try {
    if (!API_KEY) return null;

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const modelName = "gemini-3.1-flash-image-preview";
    console.log(`[Image] Generating image for: "${prompt.substring(0, 30)}..."`);
    
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

    // Find the image part in the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Image] Gemini Image Error:", error);
    return null;
  }
}

/**
 * Generates a video using Veo via the @google/genai SDK.
 */
export async function generateVideo(prompt: string): Promise<string | null> {
  try {
    if (!API_KEY) return null;

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const modelName = "veo-3.1-fast-generate-preview";
    console.log(`[Video] Generating video for: "${prompt.substring(0, 30)}..."`);
    
    let operation = await ai.models.generateVideos({
      model: modelName,
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '1:1'
      }
    });

    // Poll for completion
    let retries = 30; // 5 minutes max
    while (!operation.done && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      retries--;
    }

    if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
      const videoUri = operation.response.generatedVideos[0].video.uri;
      // To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
      const videoRes = await fetch(videoUri, {
        method: 'GET',
        headers: {
          'x-goog-api-key': API_KEY,
        },
      });
      const blob = await videoRes.blob();
      return URL.createObjectURL(blob);
    }
    
    return null;
  } catch (error) {
    console.error("[Video] Gemini Video Error:", error);
    return null;
  }
}
