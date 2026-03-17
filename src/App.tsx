import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
              Join EnvisionPaths <span className="text-[10px] not-italic opacity-30">V1.2</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2">Create your account to start your journey.</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Your Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="email" 
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 transition-all group">
              Join EnvisionPaths
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button className="text-xs text-gray-500 hover:text-white transition-colors">
              Already have an account? Sign In
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-2 text-gray-600">
            <Shield size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Tester's Quick Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
