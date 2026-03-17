import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, 
  LayoutDashboard, Play, History, Calendar, CreditCard, Settings, LogOut,
  User, Briefcase, TrendingUp, Clock
} from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedSid = localStorage.getItem('ep_sid');
      try {
        const res = await fetch('/api/user/profile', {
          credentials: 'include',
          headers: storedSid ? { 'x-session-id': storedSid } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('ep_sid');
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
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.sessionId) {
        localStorage.setItem('ep_sid', data.sessionId);
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
    if (type === 'admin') {
      const pin = prompt('Enter Admin PIN:');
      if (pin !== '7777') {
        setError('Invalid Admin PIN');
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    let endpoint = '/api/auth/login';
    let payload: any = {};

    if (type === 'admin') {
      endpoint = '/api/admin-login';
      payload = { email: 'harrisonw707@gmail.com', pin: '7777' };
    } else if (type === 'standard') {
      payload = { email: 'standard-test@envisionpaths.com', password: 'Password123!' };
    } else if (type === 'premium') {
      payload = { email: 'premium-test@envisionpaths.com', password: 'VertexPassword123!' };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.sessionId) {
        localStorage.setItem('ep_sid', data.sessionId);
      }

      setUser(data.user);
      setSuccess(`Logged in as ${type}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const storedSid = localStorage.getItem('ep_sid');
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
        headers: storedSid ? { 'x-session-id': storedSid } : {}
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('ep_sid');
    setUser(null);
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col">
          <div className="p-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">
              Envision<span className="text-red-600">Paths</span>
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {[
              { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
              { id: 'simulate', icon: Play, label: 'New Simulation' },
              { id: 'history', icon: History, label: 'History' },
              { id: 'schedule', icon: Calendar, label: 'Schedule' },
              { id: 'billing', icon: CreditCard, label: 'Billing' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === item.id 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/5">
            <div className="bg-white/5 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-black">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-black uppercase truncate">{user.email.split('@')[0]}</p>
                  <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{user.plan_type}</p>
                </div>
              </div>
              <div className="text-center">
                <span className="text-red-500 text-[9px] font-black uppercase tracking-widest animate-pulse">
                  3 Days Left
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-widest"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-12">
          <header className="mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
                {activeTab === 'overview' ? 'Dashboard' : activeTab.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </h2>
              <p className="text-gray-500 mt-2 font-medium">Welcome back to your strategic path.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#111] border border-white/5 px-6 py-3 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Simulations</p>
                <p className="text-2xl font-black italic">{user.simulations_this_month || 0} / 10</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-6">
                    <div className="bg-[#111] border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                      <h3 className="text-2xl font-black uppercase italic mb-4">Start New Session</h3>
                      <p className="text-gray-400 mb-8 max-w-md">Ready to sharpen your skills? Our AI-powered simulation will guide you through a realistic interview scenario.</p>
                      <button 
                        onClick={() => setActiveTab('simulate')}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 transition-all"
                      >
                        Launch Simulation
                        <Play size={18} fill="currentColor" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-[#111] border border-white/5 p-8 rounded-3xl">
                        <TrendingUp className="text-red-600 mb-4" size={32} />
                        <h4 className="text-lg font-black uppercase italic mb-2">Performance</h4>
                        <p className="text-3xl font-black italic">84%</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">+12% from last week</p>
                      </div>
                      <div className="bg-[#111] border border-white/5 p-8 rounded-3xl">
                        <Clock className="text-red-600 mb-4" size={32} />
                        <h4 className="text-lg font-black uppercase italic mb-2">Time Spent</h4>
                        <p className="text-3xl font-black italic">4.2h</p>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Across 8 sessions</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 p-8 rounded-3xl">
                      <h3 className="text-xl font-black uppercase italic mb-6">Recent Activity</h3>
                      <div className="space-y-6">
                        {[
                          { label: 'System Design', date: '2h ago', score: '92' },
                          { label: 'Behavioral', date: 'Yesterday', score: '78' },
                          { label: 'Frontend Tech', date: '3 days ago', score: '85' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                            <div>
                              <p className="text-sm font-black uppercase">{item.label}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{item.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black italic text-red-500">{item.score}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-600 to-red-900 p-8 rounded-3xl">
                      <h3 className="text-xl font-black uppercase italic mb-2">Upgrade to Elite</h3>
                      <p className="text-xs text-white/70 mb-6">Unlock unlimited simulations and personalized AI feedback.</p>
                      <button 
                        onClick={() => setActiveTab('billing')}
                        className="w-full bg-white text-red-600 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all"
                      >
                        View Plans
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'overview' && (
                <div className="bg-[#111] border border-white/5 p-20 rounded-[40px] text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="text-gray-600 animate-spin" size={40} />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic">Module Under Construction</h3>
                  <p className="text-gray-500 max-w-md mx-auto">We're currently fine-tuning the {activeTab} engine. Check back in a few hours for the full experience.</p>
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className="text-red-500 font-black uppercase tracking-widest text-xs hover:underline"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
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
