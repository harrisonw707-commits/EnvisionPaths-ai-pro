// AI Service using backend proxy
export interface AIResponse {
  text: string;
}

/**
 * Generates content using the Gemini model via the backend proxy.
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
      const modelName = "gemini-3.1-pro-preview";
      console.log(`[AI] Attempting generation via proxy with ${modelName} (Retries: ${retries - 1})`);
      
      const payload = {
        contents: [
          ...history,
          { role: "user", parts: [{ text: prompt }] }
        ],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: 0.7,
        }
      };

      const response = await fetch('/api/ai/generate',{ 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          payload
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.error || "Proxy request failed");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("Gemini returned an empty response (possibly blocked by safety filters or empty output).");
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
 * Generates speech from text using Gemini TTS via backend proxy.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const modelName = "gemini-2.5-flash-preview-tts";
    console.log(`[TTS] Generating speech via proxy for: "${text.substring(0, 30)}..."`);
    
    const payload = {
      contents: [{ parts: [{ text: `Say in a professional, clear, and encouraging tone: ${text}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      }
    };

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        payload
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "TTS Proxy failed");
    }

    const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("[TTS] Gemini TTS Error:", error);
    return null;
  }
}

/**
 * Generates an image using Gemini via backend proxy.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const modelName = "gemini-3.1-flash-image-preview";
    console.log(`[Image] Generating image via proxy for: "${prompt.substring(0, 30)}..."`);
    
    const payload = {
      contents: {
        parts: [{ text: prompt }]
      },
      generationConfig: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    };

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        payload
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Image Proxy failed");
    }

    // Find the image part in the response
    for (const part of data.candidates?.[0]?.content?.parts || []) {
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
 * Generates a video using Veo via backend proxy.
 */
export async function generateVideo(prompt: string): Promise<string | null> {
  try {
    const modelName = "veo-3.1-fast-generate-preview";
    console.log(`[Video] Generating video via proxy for: "${prompt.substring(0, 30)}..."`);
    
    const payload = {
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '1:1'
      }
    };

    let response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        payload
      })
    });

    let data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Video Proxy failed");
    }

    let operation = data;

    // Poll for completion
    let retries = 30; // 5 minutes max
    while (!operation.done && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      const pollRes = await fetch(`/api/ai/operations/${operation.name}`);
      operation = await pollRes.json();
      retries--;
    }

    if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
      const videoUri = operation.response.generatedVideos[0].video.uri;
      // Fetch the video with the API key (handled by proxy)
      const videoRes = await fetch(`/api/ai/video-proxy?uri=${encodeURIComponent(videoUri)}`);
      const blob = await videoRes.blob();
      return URL.createObjectURL(blob);
    }
    
    return null;
  } catch (error) {
    console.error("[Video] Gemini Video Error:", error);
    return null;
  }
}
