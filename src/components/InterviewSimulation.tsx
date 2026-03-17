import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, X, AlertCircle, CheckCircle2, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { Message, Simulation } from '../types';
import { api } from '../services/api';

interface InterviewSimulationProps {
  onClose: () => void;
  onComplete: () => void;
}

export function InterviewSimulation({ onClose, onComplete }: InterviewSimulationProps) {
  const [step, setStep] = useState<'setup' | 'chat' | 'feedback'>('setup');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulationId, setSimulationId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startSimulation = async () => {
    if (!jobTitle || !industry) return;
    setLoading(true);
    try {
      const res = await api.simulations.start(jobTitle, industry);
      if (res.error) {
        alert(res.error);
        return;
      }
      setSimulationId(res.simulation_id);
      setStep('chat');
      
      // Initial AI message
      const initialPrompt = `You are an expert interviewer for a ${jobTitle} position in the ${industry} industry. 
      Start the interview by introducing yourself briefly and asking the first question. 
      Keep it professional and strategic.`;
      
      const aiRes = await api.ai.generate('gemini-3-flash-preview', {
        contents: [{ parts: [{ text: initialPrompt }] }]
      });
      
      const firstMsg = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || "Hello! I'm your interviewer today. Let's get started. Tell me about yourself.";
      setMessages([{ role: 'assistant', text: firstMsg }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const aiRes = await api.ai.generate('gemini-3-flash-preview', {
        contents: [...history, { role: 'user', parts: [{ text: input }] }],
        config: {
          systemInstruction: `You are an expert interviewer for a ${jobTitle} position in the ${industry} industry. 
          Conduct a realistic interview. Ask one question at a time. 
          If the user has answered 5 questions, conclude the interview and say [INTERVIEW_COMPLETE].`
        }
      });

      const aiText = aiRes.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";
      
      if (aiText.includes('[INTERVIEW_COMPLETE]')) {
        const cleanText = aiText.replace('[INTERVIEW_COMPLETE]', '').trim();
        if (cleanText) setMessages(prev => [...prev, { role: 'assistant', text: cleanText }]);
        generateFeedback();
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: aiText }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setLoading(true);
    try {
      const interviewTranscript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      const feedbackPrompt = `As an expert interview coach, evaluate the following interview transcript for a ${jobTitle} role.
      Provide:
      1. A score out of 100.
      2. Key Strengths.
      3. Areas for Improvement.
      4. A strategic summary.
      Format the response as JSON: { "score": number, "strengths": string[], "improvements": string[], "summary": string }`;

      const aiRes = await api.ai.generate('gemini-3-flash-preview', {
        contents: [{ parts: [{ text: feedbackPrompt + "\n\nTranscript:\n" + interviewTranscript }] }],
        config: { responseMimeType: 'application/json' }
      });

      const feedbackData = JSON.parse(aiRes.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      setFeedback(feedbackData);
      
      // Save to DB
      if (simulationId) {
        await api.simulations.complete({
          simulation_id: simulationId,
          job_title: jobTitle,
          industry: industry,
          score: feedbackData.score || 0,
          feedback: JSON.stringify(feedbackData),
          messages: messages
        });
      }
      
      setStep('feedback');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight italic">
              {step === 'setup' ? 'Interview Setup' : step === 'chat' ? 'Live Simulation' : 'Performance Report'}
            </h2>
            {jobTitle && <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{jobTitle} • {industry}</p>}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto w-full h-full">
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <motion.div 
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center space-y-12 py-12"
              >
                <div className="text-center space-y-4">
                  <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">
                    Configure Your <br /> <span className="text-red-600">Strategic Session</span>
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Tell us what role you're targeting so our AI can prepare the most relevant questions.
                  </p>
                </div>

                <div className="w-full max-w-md space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Target Job Title</label>
                    <input 
                      type="text" 
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Product Manager"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Industry</label>
                    <input 
                      type="text" 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Fintech, Healthcare, Tech"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <button 
                    onClick={startSimulation}
                    disabled={!jobTitle || !industry || loading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 transition-all group disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Begin Simulation'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col h-full"
              >
                <div className="flex-1 space-y-8 pb-32">
                  {messages.map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: msg.role === 'assistant' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[80%] p-6 rounded-3xl ${
                        msg.role === 'assistant' 
                          ? 'bg-[#111] border border-white/5 text-white rounded-tl-none' 
                          : 'bg-red-600 text-white rounded-tr-none'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#111] border border-white/5 p-6 rounded-3xl rounded-tl-none">
                        <Loader2 className="animate-spin text-red-500" size={20} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
                  <div className="max-w-3xl mx-auto relative">
                    <input 
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your response..."
                      className="w-full bg-[#111] border border-white/10 rounded-full py-5 pl-8 pr-32 text-sm focus:outline-none focus:border-red-500 transition-all shadow-2xl"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button className="p-3 text-gray-500 hover:text-white transition-colors">
                        <Mic size={20} />
                      </button>
                      <button 
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'feedback' && feedback && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12 py-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Score Card */}
                  <div className="md:col-span-1 bg-[#111] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle 
                          cx="64" cy="64" r="60" 
                          fill="none" stroke="currentColor" 
                          strokeWidth="8" className="text-white/5"
                        />
                        <circle 
                          cx="64" cy="64" r="60" 
                          fill="none" stroke="currentColor" 
                          strokeWidth="8" className="text-red-600"
                          strokeDasharray={377}
                          strokeDashoffset={377 - (377 * feedback.score) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-3xl font-black italic">{feedback.score}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Overall Score</p>
                  </div>

                  {/* Summary Card */}
                  <div className="md:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-8 space-y-4">
                    <h4 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                      <MessageSquare size={20} className="text-red-500" />
                      Coach's Summary
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feedback.summary}
                    </p>
                  </div>

                  {/* Strengths */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-8 space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Key Strengths
                    </h4>
                    <ul className="space-y-4">
                      {feedback.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-emerald-100/70 flex gap-3">
                          <span className="text-emerald-500">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Improvements */}
                  <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 space-y-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Areas for Growth
                    </h4>
                    <ul className="space-y-4">
                      {feedback.improvements.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-red-100/70 flex gap-3">
                          <span className="text-red-500">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="md:col-span-3">
                    <button 
                      onClick={onComplete}
                      className="w-full bg-white text-black font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-gray-200 transition-all"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
