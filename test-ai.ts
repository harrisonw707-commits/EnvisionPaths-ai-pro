import { GoogleGenAI } from "@google/genai";

async function testAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing!");
    return;
  }
  console.log("GEMINI_API_KEY is present.");

  try {
    const genAI = new GoogleGenAI({ apiKey });
    const result = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Hello",
    });
    console.log("AI Response:", result.text);
  } catch (err) {
    console.error("AI Error:", err);
  }
}

testAI();
