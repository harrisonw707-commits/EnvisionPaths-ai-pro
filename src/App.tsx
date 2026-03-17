import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(isLogin ? 'Welcome back!' : 'Account created successfully!');
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (type: 'admin' | 'standard' | 'premium') => {
    setLoading(true);
    setError(null);
    
    let endpoint = '/api/auth/login';
    let payload: any = {};

    if (type === 'admin') {
      endpoint = '/api/admin-login';
      payload = { email: 'harrisonw707@gmail.com' };
    } else if (type === 'standard') {
      payload = { email: 'standard-test@envisionpaths.com', password: 'Password123!' };
    } else if (type === 'premium') {
      payload = { email: 'premium-test@envisionpaths.com', password: 'VertexPassword123!' };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      setSuccess(`Logged in as ${type}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#111] border border-white/5 p-12 rounded-3xl text-center space-y-6"
        >
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-red-600" size={40} />
          </div>
          <h2 className="text-3xl font-black uppercase italic">Welcome, {user.email.split('@')[0]}</h2>
          <p className="text-gray-400">You are currently on the <span className="text-red-500 font-bold uppercase">{user.plan_type}</span> plan.</p>
          <div className="pt-6">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
            >
              Go to Dashboard
            </button>
          </div>
          <button 
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              setUser(null);
            }}
            className="text-xs text-gray-600 hover:text-red-500 transition-colors"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block px-4 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">
              Strategic Interview Coaching
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] italic">
            Navigate <br />
            Your Path <br />
            <span className="text-red-600">Towards Success</span>
          </h1>
        </div>

        <div className="bg-[#111] border border-white/5 p-12 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
          
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tight italic">
              {isLogin ? 'Sign In' : 'Join'} EnvisionPaths <span className="text-[10px] not-italic opacity-30">V1.2</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {isLogin ? 'Welcome back to your journey.' : 'Create your account to start your journey.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 mb-6"
              >
                <AlertCircle className="text-red-500 shrink-0" size={18} />
                <p className="text-xs text-red-500 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Your Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Your Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 transition-all group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Join EnvisionPaths'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Join Now" : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Shield size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tester's Quick Access</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleQuickLogin('admin')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-[9px] font-black uppercase tracking-tighter transition-all"
              >
                Admin
              </button>
              <button 
                onClick={() => handleQuickLogin('standard')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-[9px] font-black uppercase tracking-tighter transition-all"
              >
                Standard
              </button>
              <button 
                onClick={() => handleQuickLogin('premium')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-[9px] font-black uppercase tracking-tighter transition-all"
              >
                Premium
              </button>
            </div>

            <div className="text-center">
              <span className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                3 Days of Testing Left
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
