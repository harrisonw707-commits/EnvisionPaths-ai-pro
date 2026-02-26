/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
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
  LogOut,
  LayoutDashboard,
  FileText,
  TrendingUp,
  CreditCard,
  GraduationCap,
  Zap,
  Sparkles,
  Rocket,
  Star,
  BarChart2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const featureCards = [
  {
    icon: <Zap size={28} />,
    title: 'Interview Coach',
    description: 'AI-powered mock interviews with real-time feedback tailored to your target role and industry.',
    badge: 'Popular',
  },
  {
    icon: <FileText size={28} />,
    title: 'Resume Builder',
    description: 'Smart resume analysis and optimization powered by advanced AI to help you stand out.',
  },
  {
    icon: <BarChart2 size={28} />,
    title: 'Career Insights',
    description: 'Data-driven analytics on your performance, strengths, and areas for growth over time.',
    badge: 'New',
  },
  {
    icon: <GraduationCap size={28} />,
    title: 'AI Coach',
    description: 'Personalized career coaching sessions with actionable roadmaps for your next big move.',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'Skill Assessment',
    description: 'Identify skill gaps and receive curated learning paths to reach your career goals faster.',
  },
  {
    icon: <Rocket size={28} />,
    title: 'Job Matching',
    description: 'Discover roles that match your profile and get interview-ready with targeted preparation.',
  },
];

interface NavItem {
  id: AppStep | 'dashboard';
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'setup', label: 'Interview', icon: <MessageSquare size={20} />, requiresAuth: true },
  { id: 'home', label: 'Resume', icon: <FileText size={20} /> },
  { id: 'home', label: 'Insights', icon: <TrendingUp size={20} /> },
  { id: 'home', label: 'Coach', icon: <GraduationCap size={20} />, requiresAuth: true },
  { id: 'pricing', label: 'Billing', icon: <CreditCard size={20} /> },
];

// Initialize Gemini lazily to avoid crashing when API key is absent
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return genAI;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

type AppStep = 'home' | 'auth' | 'pricing' | 'setup' | 'interview' | 'summary' | 'privacy' | 'terms';

export default function App() {
  const [step, setStep] = useState<AppStep>('home');
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
    if (authMode === 'signup') {
      setStep('pricing');
    } else {
      setStep('setup');
    }
  };

  const selectPlan = (plan: 'pro' | 'elite') => {
    setSelectedPlan(plan);
    setStep('setup');
  };

  const endInterview = async () => {
    setStep('summary');
    setIsGeneratingSummary(true);
    
    try {
      const conversation = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
      const prompt = `As an expert career coach at EnvisionPaths, analyze the following mock interview for a ${jobTitle} role. 
      Provide a comprehensive summary including:
      1. Overall Performance Score (out of 10)
      2. Key Strengths (3 points)
      3. Areas for Improvement (3 points)
      4. A final encouraging "Roadmap to Success" for this candidate.
      
      Format the response clearly with headings.
      
      Interview Transcript:
      ${conversation}`;

      const response = await getGenAI().models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      setSummary(response.text || "No feedback generated.");
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
    
    const prompt = `You are a professional career coach and expert interviewer at EnvisionPaths. 
    I am applying for the position of ${jobTitle} in the ${industry} industry. 
    Please start the interview by introducing yourself briefly and asking the first interview question. 
    Keep your tone professional, encouraging, and insightful.`;

    try {
      const model = getGenAI().models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      const response = await model;
      const text = response.text || "Welcome to your interview simulation.";
      
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

      const response = await getGenAI().models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          ...history,
          { role: "user", parts: [{ text: input }] }
        ],
        config: {
          systemInstruction: `You are an expert career coach at EnvisionPaths. 
          Conduct a realistic interview for a ${jobTitle} role. 
          After the user answers a question, briefly acknowledge their answer with a "Coach's Tip" (in italics) 
          and then move on to the next insightful interview question. 
          Focus on behavioral, technical, and situational questions.`
        }
      });

      const text = response.text || "I'm sorry, I couldn't process that. Could you repeat?";
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

  const handleNavClick = (item: NavItem) => {
    setActiveNav(item.label);
    if (item.requiresAuth && !isLoggedIn) {
      setStep('auth');
    } else if (item.id === 'dashboard') {
      setStep('home');
    } else {
      setStep(item.id as AppStep);
    }
    setSidebarOpen(false);
  };

  const getActiveNav = () => {
    // Sync active nav with step changes (e.g. back navigation)
    if (step === 'setup' || step === 'interview' || step === 'summary') return 'Interview';
    if (step === 'pricing') return 'Billing';
    if (step === 'home' && activeNav !== 'Dashboard' && activeNav !== 'Resume' && activeNav !== 'Insights' && activeNav !== 'Coach') return 'Dashboard';
    return activeNav;
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] font-sans text-white selection:bg-red-600 selection:text-white flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-20 bg-[#111111] border-r border-white/10 flex flex-col items-center py-5 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-11 h-11 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <Target size={22} />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1 w-full px-2">
          {navItems.map((item) => {
            const active = getActiveNav() === item.label;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                title={item.label}
                className={`w-full flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all group ${
                  active 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={active ? 'text-white' : 'group-hover:text-red-400 transition-colors'}>{item.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        {isLoggedIn && (
          <button
            onClick={() => { setStep('home'); setIsLoggedIn(false); setSidebarOpen(false); }}
            className="text-zinc-500 hover:text-red-400 transition-colors p-3 rounded-xl hover:bg-white/5"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-20 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-zinc-400 hover:text-white mr-4 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Branding */}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-base font-black tracking-tighter text-white uppercase italic leading-none">
                  <span className="text-red-500">ENVISION</span>PATHS
                </h1>
                <p className="text-[10px] font-bold text-[#FFD700] uppercase tracking-[0.25em] leading-none mt-0.5">Elite Career Coaching</p>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-auto">
              {step === 'interview' && (
                <button 
                  onClick={endInterview}
                  className="text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg border border-white/20 transition-all shadow-lg shadow-red-900/20"
                >
                  End Session
                </button>
              )}
              {!isLoggedIn && step !== 'auth' && (
                <button
                  onClick={() => setStep('auth')}
                  className="text-xs font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg border border-white/20 transition-all"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
          <AnimatePresence mode="wait">
            {step === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Hero section */}
                <div className="text-center mb-14 pt-6">
                  <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 px-4 py-1.5 rounded-full mb-6">
                    <Star size={12} className="text-[#FFD700]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">AI-Powered Career Platform</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none">
                    Elevate Your <span className="text-red-500">Career</span>
                  </h2>
                  <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                    Professional AI coaching, mock interviews, and career insights to accelerate your path to success.
                  </p>
                  <button
                    onClick={() => setStep('auth')}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl transition-all shadow-lg shadow-red-900/30 border border-white/20"
                  >
                    Get Started <ArrowRight size={18} />
                  </button>
                </div>

                {/* Feature cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featureCards.map((card) => (
                    <motion.div 
                      key={card.title} 
                      whileHover={{ y: -4 }}
                      className="group bg-[#1a1a1a] border border-white/8 rounded-2xl p-6 hover:border-red-600/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/0 group-hover:from-red-600/5 group-hover:to-transparent transition-all duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-red-600/15 border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-600/25 transition-colors">
                            {card.icon}
                          </div>
                          {card.badge && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2.5 py-1 rounded-full">
                              {card.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black uppercase tracking-tight mb-2 group-hover:text-red-400 transition-colors">{card.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{card.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : step === 'auth' ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-md mx-auto mt-20"
            >
              {/* ... auth content ... */}
              <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
                    {authMode === 'login' ? 'Welcome Back' : 'Join Elite'}
                  </h2>
                  <p className="text-zinc-500 text-sm">Elevate your career trajectory with EnvisionPaths.</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="name@company.com"
                        className="w-full pl-12 pr-4 py-4 bg-black border border-white/10 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-black border border-white/10 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 border border-white/20 group"
                  >
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors block w-full"
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
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-8 border-b border-red-600 pb-4">Privacy Policy</h2>
                
                <div className="space-y-8 text-zinc-400 text-sm leading-relaxed">
                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">1. Data Collection</h3>
                    <p>EnvisionPaths collects minimal personal data required for account creation and interview simulation. This includes your email address and the job titles/industries you provide for practice sessions.</p>
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
                    <p>You have the right to access, correct, or delete your data at any time. Contact our elite support team for any data-related inquiries.</p>
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
                    <p>By accessing EnvisionPaths, you agree to be bound by these elite terms of service. Our platform is designed for professional development and career advancement simulation.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">2. User Conduct</h3>
                    <p>Users must interact with the AI simulation in a professional manner. Any attempt to exploit or manipulate the AI engine for non-career-related purposes may result in immediate account termination.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">3. Subscription & Billing</h3>
                    <p>Subscription fees are billed in advance on a monthly basis. Free tier users are limited to 2 simulations per month. Elite and Pro features are subject to active subscription status.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold uppercase tracking-widest mb-3">4. Limitation of Liability</h3>
                    <p>EnvisionPaths provides simulations for practice purposes only. We do not guarantee employment or specific career outcomes. The performance score is an AI-generated estimate based on your simulation input.</p>
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
                <div className="bg-zinc-900/50 border border-white/10 p-10 rounded-3xl backdrop-blur-sm flex flex-col hover:border-red-600/50 transition-all group">
                  <div className="mb-8">
                    <h3 className="text-2xl font-black uppercase italic mb-2">Pro</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$9.99</span>
                      <span className="text-zinc-500 text-sm uppercase font-bold tracking-widest">/ month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Unlimited Mock Interviews
                    </li>
                    <li className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Standard AI Feedback
                    </li>
                    <li className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Email Support
                    </li>
                  </ul>

                  <button 
                    onClick={() => selectPlan('pro')}
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
                  >
                    Select Pro
                  </button>
                </div>

                {/* Elite Tier */}
                <div className="bg-zinc-900 border-2 border-red-600 p-10 rounded-3xl backdrop-blur-sm flex flex-col relative shadow-[0_0_40px_rgba(220,38,38,0.15)]">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20">
                    Recommended
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-black uppercase italic mb-2 text-red-500">Elite</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$19.99</span>
                      <span className="text-zinc-500 text-sm uppercase font-bold tracking-widest">/ month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Everything in Pro
                    </li>
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Advanced Performance Analysis
                    </li>
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Video Simulation Mode
                    </li>
                    <li className="flex items-center gap-3 text-white text-sm font-bold">
                      <CheckCircle2 size={18} className="text-red-600" />
                      Priority Coach Access
                    </li>
                  </ul>

                  <button 
                    onClick={() => selectPlan('elite')}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl border border-white/20 transition-all shadow-lg shadow-red-900/40"
                  >
                    Go Elite
                  </button>
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
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-3">Prepare for Battle</h2>
                <div className="flex items-center justify-between mb-10">
                  <p className="text-zinc-400 leading-relaxed">The interview is your arena. Define your target and let's begin the simulation.</p>
                  {!selectedPlan && (
                    <div className="bg-red-600/10 border border-red-600/20 px-3 py-1 rounded-full">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        Sessions: {sessionsUsed}/2
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">Target Position</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                      <input 
                        type="text" 
                        placeholder="e.g. Director of Engineering"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full pl-12 pr-4 py-5 bg-black border border-white/10 rounded-2xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-lg font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-red-500 ml-1">Industry Sector</label>
                    <select 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-6 py-5 bg-black border border-white/10 rounded-2xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-lg appearance-none"
                    >
                      <option value="">Select Sector</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Defense">Defense & Aerospace</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  <button 
                    onClick={startInterview}
                    disabled={!jobTitle}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.3em] py-6 rounded-2xl shadow-xl shadow-red-900/20 transition-all flex items-center justify-center gap-3 border border-white/20 group"
                  >
                    Initialize Simulation
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="mt-16 grid grid-cols-3 gap-6">
                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center group hover:border-red-600/50 transition-colors">
                    <Award className="mx-auto text-red-600 mb-3" size={28} />
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition-colors">Elite Tips</p>
                  </div>
                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center group hover:border-red-600/50 transition-colors">
                    <CheckCircle2 className="mx-auto text-red-600 mb-3" size={28} />
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest group-hover:text-white transition-colors">Performance</p>
                  </div>
                  <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl text-center group hover:border-red-600/50 transition-colors">
                    <MessageSquare className="mx-auto text-red-600 mb-3" size={28} />
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
                        msg.role === 'user' ? 'bg-red-600 border-white/20' : 'bg-zinc-900 border-white/10'
                      }`}>
                        {msg.role === 'user' ? <User size={20} /> : <Bot size={20} className="text-red-500" />}
                      </div>
                      <div className={`p-6 rounded-2xl shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-zinc-900 border border-red-600/50 text-white rounded-tr-none' 
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
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]" />
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
                    className="w-full pl-8 pr-20 py-6 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-lg"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 disabled:opacity-30 transition-all shadow-lg shadow-red-900/20 border border-white/20"
                  >
                    <Send size={22} />
                  </button>
                </form>
                <div className="flex justify-between items-center mt-6 px-2">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black">
                    EnvisionPaths Intelligence Simulation
                  </p>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600/40" />
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
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-red-900/40 border border-white/20">
                      <Award size={40} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter uppercase italic">Performance Report</h2>
                      <p className="text-red-500 font-bold uppercase tracking-widest text-xs mt-1">{jobTitle}</p>
                    </div>
                  </div>

                  {isGeneratingSummary ? (
                    <div className="space-y-8 py-20">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <RefreshCw className="text-red-600 animate-spin" size={64} />
                        <p className="text-zinc-400 font-black uppercase tracking-[0.3em] animate-pulse">Processing Simulation Data</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed text-lg font-medium border-l-2 border-red-600 pl-8">
                          {summary}
                        </div>
                      </div>

                      <div className="pt-12 border-t border-white/10 flex gap-6">
                        <button 
                          onClick={() => {
                            setStep('setup');
                            setMessages([]);
                            setSummary('');
                          }}
                          className="flex-1 bg-red-600 text-white font-black uppercase tracking-[0.3em] py-6 rounded-2xl shadow-xl shadow-red-900/40 hover:bg-red-700 transition-all border border-white/20"
                        >
                          New Simulation
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="px-10 py-6 bg-zinc-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-700 transition-all border border-white/10"
                        >
                          Export
                        </button>
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
    </div>
  );
}
