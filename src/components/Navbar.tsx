import React from 'react';
import { User } from '../types';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onNavigate: (page: string) => void;
}

export function Navbar({ user, onLogout, onOpenAuth, onNavigate }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-bottom border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button 
          onClick={() => onNavigate('home')}
          className="text-2xl font-black uppercase tracking-tighter italic hover:text-red-600 transition-colors"
        >
          Envision<span className="text-red-600">Paths</span>
        </button>

        <div className="flex items-center gap-8">
          {user ? (
            <>
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate('pricing')}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
              >
                Pricing
              </button>
              {user.is_admin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                >
                  <Shield size={12} />
                  Admin
                </button>
              )}
              <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[150px]">
                    {user.email}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-red-500">
                    {user.plan_type} Plan
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
