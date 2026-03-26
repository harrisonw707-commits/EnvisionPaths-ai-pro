export async function generateContent(prompt: string) {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error("AI request failed");
  }

  const data = await res.json();
  return { text: data.text };
}
