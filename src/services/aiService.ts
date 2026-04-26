export interface AIResponse {
  text: string;
}

/**
 * Common content generation helper using backend proxy
 */
async function callBackendAI(endpoint: string, body: any) {
  try {
    const response = await fetch(`/api/ai/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `AI request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`[AI] ${endpoint} failed:`, error);
    throw error;
  }
}

export async function* generateAIStream(prompt: string): AsyncGenerator<string> {
  try {
    // Current backend proxy doesn't stream, but we match the interface
    const result = await callBackendAI('generate', { prompt });
    if (result.text) yield result.text;
  } catch (error) {
    console.error("[AI] Streaming Error:", error);
    throw error;
  }
}

export async function generateAI(prompt: string): Promise<AIResponse> {
  const result = await callBackendAI('generate', { prompt });
  return { text: result.text || "" };
}

export async function generateContent(messageText: string, systemInstruction: string, history: any[]): Promise<AIResponse> {
  const result = await callBackendAI('generate', { 
    messageText, 
    systemInstruction, 
    history 
  });
  return { text: result.text || "" };
}

export async function generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const result = await callBackendAI('speech', { text, voiceName });
    return result.audio || null;
  } catch (error: any) {
    console.warn("[AI] TTS failed:", error.message);
    return null;
  }
}

export async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string | null> {
  try {
    const result = await callBackendAI('transcribe', { base64Audio, mimeType });
    return result.text || null;
  } catch (error) {
    console.error("[AI] Transcription Error:", error);
    return null;
  }
}
