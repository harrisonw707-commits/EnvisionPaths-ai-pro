import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, ArrowRight, Sparkles, Target, Zap, Trophy, ChevronRight } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { InterviewSimulation } from './components/InterviewSimulation';
import { Pricing } from './components/Pricing';
import { AdminDashboard } from './components/AdminDashboard';
import { User } from './types';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.auth.getProfile();
        if (res.user) {
          setUser(res.user);
          setCurrentPage('dashboard');
        }
      } catch (err) {
        console.error('Auth check failed');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setCurrentPage('home');
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={setCurrentPage}
      />

      <main>
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-32 pb-20 px-6"
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-12">
                  <div className="inline-block px-4 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                      Strategic Interview Coaching Platform
                    </span>
                  </div>
                  <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] italic">
                    Navigate <br />
                    Your Path <br />
                    <span className="text-red-600">Towards Success</span>
                  </h1>
                  <p className="text-xl text-gray-500 max-w-lg leading-relaxed">
                    Master the art of the interview with our AI-powered strategic coaching platform. Real scenarios, real feedback, real results.
                  </p>
                  <div className="flex flex-wrap gap-6">
                    <button 
                      onClick={() => setIsAuthOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-10 py-6 rounded-2xl flex items-center gap-4 transition-all group"
                    >
                      Start Your Journey
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest px-10 py-6 rounded-2xl transition-all">
                      View Demo
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-4 bg-red-600/20 blur-3xl rounded-full" />
                  <div className="relative bg-[#111] border border-white/5 p-12 rounded-[40px] shadow-2xl space-y-12">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <Target size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight italic">Strategic Focus</h3>
                        <p className="text-xs text-gray-500">Targeted questions for your specific industry and role.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <Zap size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight italic">Instant Feedback</h3>
                        <p className="text-xs text-gray-500">AI-driven analysis of your responses and body language.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <Trophy size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight italic">Proven Results</h3>
                        <p className="text-xs text-gray-500">Join 10,000+ professionals who landed their dream jobs.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                          <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight italic">AI Coaching</h3>
                        <p className="text-xs text-gray-500">Personalized guidance from our advanced strategic AI.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'dashboard' && user && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Dashboard 
                user={user} 
                onStartSimulation={() => setIsSimulationOpen(true)}
                onViewSimulation={(id) => {
                  // Implement view report logic
                  console.log('Viewing simulation:', id);
                }}
              />
            </motion.div>
          )}

          {currentPage === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Pricing onPlanSelect={(plan) => console.log('Selected plan:', plan)} />
            </motion.div>
          )}

          {currentPage === 'admin' && user?.is_admin && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={handleAuthSuccess}
      />

      {isSimulationOpen && (
        <InterviewSimulation 
          onClose={() => setIsSimulationOpen(false)}
          onComplete={() => {
            setIsSimulationOpen(false);
            setCurrentPage('dashboard');
            // Refresh profile to get updated simulation count
            api.auth.getProfile().then(res => res.user && setUser(res.user));
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black uppercase tracking-tighter italic">
            Envision<span className="text-red-600">Paths</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-700">
            © 2026 EnvisionPaths. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

