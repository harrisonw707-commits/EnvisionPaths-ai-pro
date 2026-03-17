import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, History, Bell, Settings, ArrowRight, Star, Clock, Trash2 } from 'lucide-react';
import { User, Simulation, Reminder } from '../types';
import { api } from '../services/api';
import { formatDate } from '../lib/utils';

interface DashboardProps {
  user: User;
  onStartSimulation: () => void;
  onViewSimulation: (id: number) => void;
}

export function Dashboard({ user, onStartSimulation, onViewSimulation }: DashboardProps) {
  const [history, setHistory] = useState<Simulation[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, remindersRes] = await Promise.all([
          api.simulations.getHistory(),
          api.reminders.list()
        ]);
        setHistory(historyRes.history || []);
        setReminders(remindersRes.reminders || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleReminder = async (id: number, completed: boolean) => {
    try {
      await api.reminders.update(id, !completed);
      setReminders(reminders.map(r => r.id === id ? { ...r, completed: !completed } : r));
    } catch (err) {
      console.error('Failed to update reminder', err);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      await api.reminders.delete(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete reminder', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-32 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-500 text-[8px] font-black uppercase tracking-widest">
              Welcome Back
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none italic">
            Your <span className="text-red-600">Command Center</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#111] border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Plan Status</span>
            <span className="text-sm font-black uppercase italic text-white">{user.plan_type}</span>
          </div>
          <div className="bg-[#111] border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Simulations</span>
            <span className="text-sm font-black uppercase italic text-white">{user.simulations_this_month || 0} / {user.plan_type === 'free' ? 2 : '∞'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Action Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="lg:col-span-2 bg-red-600 rounded-3xl p-12 flex flex-col justify-between min-h-[400px] relative overflow-hidden group cursor-pointer"
          onClick={onStartSimulation}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
          
          <div className="relative space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-red-600">
              <Play size={32} fill="currentColor" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter leading-none italic text-white">
              Start New <br /> Simulation
            </h2>
            <p className="text-white/70 max-w-md">
              Practice your interview skills with our strategic AI coach. Get real-time feedback and improve your performance.
            </p>
          </div>

          <div className="relative flex items-center gap-4 text-white font-black uppercase tracking-widest text-sm">
            Launch Simulation <ArrowRight size={20} />
          </div>
        </motion.div>

        {/* Reminders Card */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
              <Bell size={20} className="text-red-500" />
              Practice Schedule
            </h3>
          </div>

          <div className="space-y-4">
            {reminders.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-xs uppercase font-black tracking-widest">No reminders set</p>
              </div>
            ) : (
              reminders.map((reminder) => (
                <div 
                  key={reminder.id}
                  className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleReminder(reminder.id, reminder.completed)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        reminder.completed ? 'bg-red-500 border-red-500' : 'border-white/10 hover:border-red-500'
                      }`}
                    >
                      {reminder.completed && <Star size={12} fill="white" className="text-white" />}
                    </button>
                    <div>
                      <p className={`text-sm font-bold ${reminder.completed ? 'line-through text-gray-600' : 'text-white'}`}>
                        {reminder.title}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                        {formatDate(reminder.scheduled_at)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteReminder(reminder.id)}
                    className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-3 bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
              <History size={20} className="text-red-500" />
              Simulation History
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Job Title</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Industry</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Score</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center text-gray-600">
                      <p className="text-xs uppercase font-black tracking-widest">No simulations found</p>
                    </td>
                  </tr>
                ) : (
                  history.map((sim) => (
                    <tr key={sim.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-white">{sim.job_title}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs text-gray-400 uppercase font-black tracking-widest">{sim.industry}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600" 
                              style={{ width: `${sim.score || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-white">{sim.score || 0}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs text-gray-500">{formatDate(sim.created_at)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => onViewSimulation(sim.id)}
                          className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
