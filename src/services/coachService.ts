import { generateContent, streamContent } from './aiService';

export interface CoachOptions {
  jobTitle: string;
  isFree: boolean;
  isPro: boolean;
  questionsAsked: number;
  interviewLength: number;
}

/**
 * Generates the system instruction for the interview coach.
 */
export function getCoachSystemInstruction(options: CoachOptions): string {
  const { jobTitle, isFree, isPro, questionsAsked, interviewLength } = options;
  
  return `You are an expert career coach. 
Conduct a realistic interview for a ${jobTitle} role. 
${isFree ? 'This is a free trial session, so keep the interview concise (max 5 questions total).' : ''}
${isPro ? 'Provide deep behavioral and technical analysis in your feedback. Focus on high-level strategic answers.' : 'Focus on standard interview questions.'}
After the user answers a question, briefly acknowledge their answer with a "Coach's Tip" (in italics) 
and then move on to the next insightful interview question. 
Focus on behavioral, technical, and situational questions.

MANDATORY: At some point during the interview (preferably towards the middle), you MUST ask the candidate: "Describe yourself with one word."

CRITICAL: You have currently asked ${questionsAsked} questions. 
The target interview length is ${interviewLength} questions.
If you have reached ${interviewLength} questions, do NOT ask another question. 
Instead, say: "That concludes our interview session! I've gathered enough information to provide your performance report. Please click the 'End Session' button to see your results."`;
}

/**
 * Generates the next question or response from the coach.
 */
export async function getCoachResponse(
  message: string,
  history: any[],
  options: CoachOptions
) {
  const systemInstruction = getCoachSystemInstruction(options);
  const response = await generateContent(message, systemInstruction, history);
  return response.text;
}

/**
 * Streams the coach's response.
 */
export async function streamCoachResponse(
  message: string,
  onChunk: (chunk: string) => void,
  history: any[],
  options: CoachOptions
) {
  const systemInstruction = getCoachSystemInstruction(options);
  return await streamContent(message, onChunk, systemInstruction, history);
}

/**
 * Generates an initial interview question.
 */
export async function getInitialQuestion(jobTitle: string, industry: string) {
  const prompt = `You are a professional career coach and expert interviewer at EnvisionPaths. 
I am applying for the position of ${jobTitle} in the ${industry} industry. 
Please start the interview by saying exactly: "Welcome, thanks for coming in!" followed by a brief introduction and your first interview question: "Tell me about yourself."
Keep your tone professional, encouraging, and insightful.`;
  
  const response = await generateContent(prompt);
  return response.text;
}

/**
 * Generates a performance report based on the interview transcript.
 */
export async function getPerformanceReport(transcript: string, jobTitle: string, isFree: boolean) {
  const prompt = `You are an expert career coach. Analyze the following interview transcript for a ${jobTitle} role. 
${isFree ? 'Provide a brief, standard summary including a score and 2 key points.' : 'Provide a comprehensive, advanced performance analysis including:'}
${!isFree ? `
1. Overall Performance Score (out of 10)
2. Key Strengths (3 points)
3. Areas for Improvement (3 points)
4. A final encouraging "Roadmap to Success" for this candidate.
` : ''}

Format the response clearly with headings.

Interview Transcript:
${transcript}`;

  const response = await generateContent(prompt);
  return response.text;
}
