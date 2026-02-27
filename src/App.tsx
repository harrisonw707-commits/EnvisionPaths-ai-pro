/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  Briefcase, 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  ChevronRight, 
  Award, 
  Target,
  RefreshCw,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateContent } from './services/aiService';
import { BrandLogo, BrandLogoText } from './components/BrandLogo';
import { Tooltip } from './components/Tooltip';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

type AppStep = 'auth' | 'pricing' | 'setup' | 'interview' | 'summary' | 'privacy' | 'terms';

export default function App() {
  const [step, setStep] = useState<AppStep>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'elite' | null>(null);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'signup') {
      setStep('pricing');
    } else {
      setStep('setup');
    }
  };

  const selectPlan = (plan: 'pro' | 'elite') => {
    setSelectedPlan(plan);
    const url = plan === 'pro' 
      ? 'https://buy.stripe.com/4gM00keeYdDH62d6OR9R606' 
      : 'https://buy.stripe.com/6oUbJ2gn62Z3aitc9b9R607';
    window.open(url, '_blank');
    setStep('setup');
  };

  const endInterview = async () => {
    setStep('summary');
    setIsGeneratingSummary(true);
    
    try {
      const conversation = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
      const prompt = `As an expert career coach at HireMe AI, analyze the following mock interview for a ${jobTitle} role. 
      Provide a comprehensive summary including:
      1. Overall Performance Score (out of 10)
      2. Key Strengths (3 points)
      3. Areas for Improvement (3 points)
      4. A final encouraging "Roadmap to Success" for this candidate.
      
      Format the response clearly with headings.
      
      Interview Transcript:
      ${conversation}`;

      const response = await generateContent(prompt);
      setSummary(response.text);
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("We encountered an error generating your summary. Please try again or review your chat history.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const startInterview = async () => {
    if (!jobTitle) return;
    
    if (!selectedPlan && sessionsUsed >= 2) {
      setStep('pricing');
      return;
    }
    
    setStep('interview');
    setSessionsUsed(prev => prev + 1);
    setIsTyping(true);
    
    const prompt = `You are a professional career coach and expert interviewer at HireMe AI. 
    I am applying for the position of ${jobTitle} in the ${industry} industry. 
    Please start the interview by introducing yourself briefly and asking the first interview question. 
    Keep your tone professional, encouraging, and insightful.`;

    try {
      const response = await generateContent(prompt);
      const text = response.text;
      
      setMessages([{
        role: 'model',
        text: text,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const systemInstruction = `You are an expert career coach at HireMe AI. 
      Conduct a realistic interview for a ${jobTitle} role. 
      After the user answers a question, briefly acknowledge their answer with a "Coach's Tip" (in italics) 
      and then move on to the next insightful interview question. 
      Focus on behavioral, technical, and situational questions.`;

      const response = await generateContent(input, systemInstruction, history);

      const text = response.text;
      setMessages(prev => [...prev, {
        role: 'model',
        text: text,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-yellow-400 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandLogoText />
          
          {step !== 'auth' && (
            <div className="flex items-center gap-4">
              {step === 'interview' && (
                <Tooltip content="End current session and generate report">
                  <button 
                    onClick={endInterview}
                    className="text-xs font-black uppercase tracking-widest text-black bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-md border border-white/20 transition-all shadow-lg shadow-yellow-900/20"
                  >
                    End Session
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Sign out of your account" position="bottom">
                <button 
                  onClick={() => setStep('auth')}
                  className="text-white/60 hover:text-yellow-400 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {step === 'auth' ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-xl mx-auto mt-20"
            >
              {/* ... auth content ... */}
              <div className="bg-zinc-900/50 border border-white/10 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="flex justify-center mb-12">
                  <BrandLogo size={120} className="drop-shadow-[0_0_20px_rgba(220,38,38,0.3)]" />
                </div>
                <div className="text-center mb-12">
                  <h2 className="text-5xl font-black tracking-tighter uppercase italic mb-4">
                    {authMode === 'login' ? 'Welcome Back' : 'Get Started'}
                  </h2>
                  <p className="text-zinc-500 text-lg">Elevate your career trajectory with HireMe AI.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                    <Tooltip content="Enter your registered email" position="right">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                          type="email" 
                          required
                          placeholder="name@company.com"
                          className="w-full pl-12 pr-4 py-4 bg-black border border-white/10 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-sm"
                        />
                      </div>
                    </Tooltip>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Password</label>
                    <Tooltip content="Minimum 8 characters" position="right">
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-4 bg-black border border-white/10 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-sm"
                        />
                      </div>
                    </Tooltip>
                  </div>

                  <Tooltip content="Securely access your dashboard">
                    <button 
                      type="submit"
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-[0.2em] py-5 rounded-xl transition-all shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2 border border-white/20 group"
                    >
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Tooltip>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors block w-full"
                  >
                    {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setStep('privacy')}
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest font-bold"
                    >
                      Privacy Policy
                    </button>
                    <button 
                      onClick={() => setStep('terms')}
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest font-bold"
                    >
                      Terms of Service
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : step === 'privacy' ? (
            <motion.div 
              key="privacy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto mt-12 mb-20"
            >
              <div className="bg-zinc-900/50 border border-white/10 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-8 border-b border-yellow-400 pb-4">Privacy Policy</h2>
                
                <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">1. Data Collection</h3>
                    <p>HireMe AI collects minimal personal data required for account practice. This includes your email address and the job titles/industries you provide for practice sessions.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">2. AI Processing</h3>
                    <p>Your interview responses are processed by advanced AI models to provide feedback. We do not use your personal interview data to train public models. Your session data is used exclusively to generate your performance reports.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">3. Data Security</h3>
                    <p>We implement industry-standard security measures to protect your information. All communications with our servers are encrypted via SSL/TLS.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">4. Your Rights</h3>
                    <p>You have the right to access, correct, or delete your data at any time. Contact our expert support team for any data-related inquiries.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setStep('auth')}
                  className="mt-12 w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                >
                  Back to Login
                </button>
              </div>
            </motion.div>
          ) : step === 'terms' ? (
            <motion.div 
              key="terms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto mt-12 mb-20"
            >
              <div className="bg-zinc-900/50 border border-white/10 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-8 border-b border-red-600 pb-4">Terms of Service</h2>
                
                <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">1. Acceptance of Terms</h3>
                    <p>By accessing HireMe AI, you agree to be bound by these professional terms of service. Our platform is designed for professional development and career advancement practice.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">2. User Conduct</h3>
                    <p>Users must interact with the AI practice session in a professional manner. Any attempt to exploit or manipulate the AI engine for non-career-related purposes may result in immediate account termination.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">3. Subscription & Billing</h3>
                    <p>Subscription fees are billed in advance on a monthly basis. Free tier users are limited to 2 practice sessions per month. Premium and Pro features are subject to active subscription status.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">4. Limitation of Liability</h3>
                    <p>HireMe AI provides practice sessions for professional development. We do not guarantee employment or specific career outcomes. The performance score is an AI-generated estimate based on your session input.</p>
                  </section>
                </div>

                <button 
                  onClick={() => setStep('auth')}
                  className="mt-12 w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                >
                  Back to Login
                </button>
              </div>
            </motion.div>
          ) : step === 'pricing' ? (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mt-12"
            >
              <div className="text-center mb-12">
                <h2 className="text-5xl font-black tracking-tighter uppercase italic mb-4">
                  {sessionsUsed >= 2 && !selectedPlan ? 'Limit Reached' : 'Select Your Tier'}
                </h2>
                <p className="text-zinc-400">
                  {sessionsUsed >= 2 && !selectedPlan 
                    ? 'You have used your 2 free sessions for this month. Upgrade to continue.' 
                    : 'Choose the level of preparation required for your next move.'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Pro Tier */}
                <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-3xl backdrop-blur-sm flex flex-col hover:border-yellow-400/50 transition-all group">
                  <div className="mb-8">
                    <h3 className="text-2xl font-black uppercase italic mb-2">Pro</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$9.99</span>
                      <span className="text-zinc-500 text-sm uppercase font-bold tracking-widest">/ month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Unlimited Mock Interviews
                    </li>
                    <li className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Standard AI Feedback
                    </li>
                    <li className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Email Support
                    </li>
                  </ul>

                  <Tooltip content="Unlimited practice & basic feedback">
                    <button 
                      onClick={() => selectPlan('pro')}
                      className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                    >
                      Select Pro
                    </button>
                  </Tooltip>
                </div>

                {/* Premium Tier */}
                <div className="bg-zinc-900 border-2 border-yellow-400 p-10 rounded-3xl backdrop-blur-sm flex flex-col relative shadow-[0_0_40px_rgba(250,204,21,0.15)]">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-black border border-white/20">
                    Recommended
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-black uppercase italic mb-2 text-yellow-500">Premium</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$19.99</span>
                      <span className="text-zinc-500 text-sm uppercase font-bold tracking-widest">/ month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Everything in Pro
                    </li>
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Advanced Performance Analysis
                    </li>
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Video Practice Mode
                    </li>
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-yellow-400" />
                      Priority Coach Access
                    </li>
                  </ul>

                  <Tooltip content="Unlock advanced AI & video coaching">
                    <button 
                      onClick={() => selectPlan('elite')}
                      className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl border border-white/20 transition-all shadow-lg shadow-yellow-900/40"
                    >
                      Get Premium
                    </button>
                  </Tooltip>
                </div>
              </div>
              
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setStep('setup')}
                  className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                >
                  Continue with Free Trial
                </button>
              </div>
            </motion.div>
          ) : step === 'setup' ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mt-12"
            >
              <div className="bg-zinc-900/30 border border-white/10 rounded-3xl p-10 backdrop-blur-sm">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-3">Prepare for Success</h2>
                <div className="flex items-center justify-between mb-10">
                  <p className="text-zinc-400 leading-relaxed">The interview is your opportunity to shine. Define your goal and let's begin the practice session.</p>
                  {!selectedPlan && (
                    <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                      <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                        Sessions: {sessionsUsed}/2
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 ml-1">Target Position</label>
                    <Tooltip content="The specific role you are practicing for" position="right">
                      <div className="relative">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input 
                          type="text" 
                          placeholder="e.g. Director of Engineering"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full pl-12 pr-4 py-5 bg-black border border-white/10 rounded-2xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-lg font-medium"
                        />
                      </div>
                    </Tooltip>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-yellow-500 ml-1">Industry Sector</label>
                    <Tooltip content="Tailors the AI's industry knowledge" position="right">
                      <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-6 py-5 bg-black border border-white/10 rounded-2xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-lg appearance-none"
                      >
                        <option value="">Select Sector</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Defense">Defense & Aerospace</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </Tooltip>
                  </div>

                  <Tooltip content="Launch the AI career coach simulation">
                    <button 
                      onClick={startInterview}
                      disabled={!jobTitle}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black uppercase tracking-[0.3em] py-6 rounded-2xl shadow-xl shadow-yellow-900/20 transition-all flex items-center justify-center gap-3 border border-white/20 group"
                    >
                      Start Practice Session
                      <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Tooltip>
                </div>

                <div className="mt-16 grid grid-cols-3 gap-6">
                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center group hover:border-yellow-400/50 transition-colors">
                    <Award className="mx-auto text-yellow-400 mb-3" size={28} />
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition-colors">Expert Tips</p>
                  </div>
                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center group hover:border-yellow-400/50 transition-colors">
                    <CheckCircle2 className="mx-auto text-yellow-400 mb-3" size={28} />
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition-colors">Expert Analysis</p>
                  </div>
                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center group hover:border-yellow-400/50 transition-colors">
                    <MessageSquare className="mx-auto text-yellow-400 mb-3" size={28} />
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition-colors">Real-Time</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : step === 'interview' ? (
            <motion.div 
              key="interview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-[calc(100vh-180px)]"
            >
              <div className="flex-1 overflow-y-auto space-y-8 pb-8 px-2 scrollbar-hide">
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        msg.role === 'user' ? 'bg-yellow-400 border-white/20' : 'bg-zinc-900 border-white/10'
                      }`}>
                        {msg.role === 'user' ? <User size={20} className="text-black" /> : <Bot size={20} className="text-yellow-500" />}
                      </div>
                      <div className={`p-6 rounded-2xl shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-zinc-900 border border-yellow-400/50 text-white rounded-tr-none' 
                          : 'bg-zinc-900/50 border border-white/10 text-zinc-200 rounded-tl-none'
                      }`}>
                        <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                        <p className={`text-[9px] mt-4 font-bold uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-white/10 p-5 rounded-2xl rounded-tl-none shadow-sm flex gap-2 items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                <form onSubmit={handleSendMessage} className="relative">
                  <input 
                    type="text"
                    placeholder="Provide your response..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full pl-8 pr-20 py-6 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-lg"
                  />
                  <Tooltip content="Send your response to the coach">
                    <button 
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-400 text-black rounded-xl flex items-center justify-center hover:bg-yellow-500 disabled:opacity-30 transition-all shadow-lg shadow-yellow-900/20 border border-white/20"
                    >
                      <Send size={22} />
                    </button>
                  </Tooltip>
                </form>
                <div className="flex justify-between items-center mt-6 px-2">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black">
                    HireMe AI Career Intelligence
                  </p>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/40" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto mt-8"
            >
              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                    <BrandLogo size={80} className="shadow-2xl shadow-yellow-900/40 border border-white/20 rounded-2xl" />
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic">Performance Report</h2>
                      <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mt-1">{jobTitle}</p>
                    </div>
                  </div>

                  {isGeneratingSummary ? (
                    <div className="space-y-8 py-20">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <RefreshCw className="text-yellow-400 animate-spin" size={64} />
                        <p className="text-zinc-400 font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Your Session</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-lg font-medium border-l-2 border-yellow-400 pl-8">
                          {summary}
                        </div>
                      </div>

                      <div className="pt-12 border-t border-white/10 flex gap-6">
                        <Tooltip content="Start a fresh interview session">
                          <button 
                            onClick={() => {
                              setStep('setup');
                              setMessages([]);
                              setSummary('');
                            }}
                            className="flex-1 bg-yellow-400 text-black font-black uppercase tracking-[0.3em] py-6 rounded-2xl shadow-xl shadow-yellow-900/40 hover:bg-yellow-500 transition-all border border-white/20"
                          >
                            New Practice Session
                          </button>
                        </Tooltip>
                        <Tooltip content="Save your performance report as PDF">
                          <button 
                            onClick={() => window.print()}
                            className="px-10 py-6 bg-zinc-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-700 transition-all border border-white/10"
                          >
                            Export
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
