import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GOOGLE_API_KEY environment variable is required");
}

const client = new GoogleGenerativeAI(apiKey);

export interface AIResponse {
  text: string;
  finishReason?: string;
}

export async function generateContent(prompt: string): Promise<AIResponse> {
  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return {
      text: response.text(),
      finishReason: response.candidates?.[0]?.finishReason,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content from Gemini API");
  }
}

export async function streamContent(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    const model = client.getGenerativeModel({ model: "gemini-pro" });
    const stream = model.generateContentStream(prompt);
    
    for await (const chunk of stream.stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw new Error("Failed to stream content from Gemini API");
  }
}