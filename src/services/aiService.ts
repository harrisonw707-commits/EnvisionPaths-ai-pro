// AI Service calling Gemini directly from the frontend
// AI Service calling backend API (server handles Gemini)

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY


import { API_URL } from "../config";

export interface AIResponse {
  text: string;
}

export async function generateAI(prompt: string): Promise<AIResponse> {
  try {
    const res = await fetch(`${API_URL}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate AI response");
    }

    return await res.json();
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
}

export async function generateContent(messageText: string, systemInstruction: string, history: any[]): Promise<AIResponse> {
  try {
    const res = await fetch(`${API_URL}/api/ai/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageText, systemInstruction, history })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate AI content");
    }

    return await res.json();
  } catch (error) {
    console.error("AI Content Generation Error:", error);
    throw error;
  }
}

export async function generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/ai/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceName })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate speech");
    }

    const data = await res.json();
    return data.audio;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return null;
  }
}

 
       
   
 
   

