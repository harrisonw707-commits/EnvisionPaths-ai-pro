// AI Service calling Gemini directly from the frontend
// AI Service calling backend API (server handles Gemini)

// Initialize AI with the environment-provided API key
// The platform handles the injection of GEMINI_API_KEY


export interface AIResponse {
  text: string;
}


export async function generateAI(prompt: string) {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!res.ok) {
    throw new Error('AI request failed');
  }

  return res.json();
}

 
       
   
 
   

