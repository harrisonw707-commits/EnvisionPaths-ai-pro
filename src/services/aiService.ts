// AI Service calling the backend proxy instead of Gemini directly
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
 * Generates content using the backend proxy.
 */
export async function generateContent(
  prompt: string, 
  systemInstruction?: string,
  history: any[] = []
): Promise<AIResponse> {
  try {
    return await withRetry(async () => {
      const modelName = "gemini-3-flash-preview";
      console.log(`[AI] Generating content via backend with ${modelName}`);
      
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          payload: {
            contents: [
              ...history,
              { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: {
              temperature: 0.7,
            },
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Backend returned ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text === undefined) {
        const finishReason = data.candidates?.[0]?.finishReason;
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

    throw new Error(`AI Error: ${error.message || "Unknown error"}. Please check your connection and try again.`);
  }
}

/**
 * Streams content using the backend proxy.
 * Note: Real streaming through proxy is complex, so we fallback to non-streaming for now.
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
    const errorMsg = error.message?.toLowerCase() || "";
    if (errorMsg.includes('safety') || errorMsg.includes('blocked')) {
      onChunk("I apologize, but I cannot respond to that request as it triggers my safety filters.");
    } else {
      throw error;
    }
  }
}

/**
 * Generates speech from text using backend proxy.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    return await withRetry(async () => {
      const modelName = "gemini-2.5-flash-preview-tts";
      console.log(`[TTS] Generating speech via backend with ${modelName}`);
      
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          payload: {
            contents: [{ parts: [{ text: `Say in a professional, clear, and encouraging tone: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                },
              },
            },
          }
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || null;
    }, 2, 1000);
  } catch (error) {
    console.error("[TTS] Gemini TTS Error:", error);
    return null;
  }
}

/**
 * Generates an image using backend proxy.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  try {
    return await withRetry(async () => {
      const modelName = "gemini-3.1-flash-image-preview";
      console.log(`[Image] Generating image via backend with ${modelName}`);
      
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          payload: {
            contents: {
              parts: [{ text: prompt }]
            },
            generationConfig: {
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
              }
            }
          }
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      for (const part of data.candidates?.[0]?.content?.parts || []) {
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
 * Generates a video using backend proxy.
 */
export async function generateVideo(prompt: string): Promise<string | null> {
  try {
    return await withRetry(async () => {
      const modelName = "veo-3.1-fast-generate-preview";
      console.log(`[Video] Generating video via backend with ${modelName}`);
      
      const response = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          payload: {
            prompt,
            config: {
              numberOfVideos: 1,
              resolution: '720p',
              aspectRatio: '1:1'
            }
          }
        })
      });

      if (!response.ok) return null;
      let operation = await response.json();

      let retries = 30; // 5 minutes max
      while (!operation.done && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const opRes = await fetch(`/api/ai/operations/${operation.name}`);
        operation = await opRes.json();
        retries--;
      }

      if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
        const videoUri = operation.response.generatedVideos[0].video.uri;
        const videoProxyRes = await fetch(`/api/ai/video-proxy?uri=${encodeURIComponent(videoUri)}`);
        const blob = await videoProxyRes.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    }, 1, 1000);
  } catch (error) {
    console.error("[Video] Gemini Video Error:", error);
    return null;
  }
}
