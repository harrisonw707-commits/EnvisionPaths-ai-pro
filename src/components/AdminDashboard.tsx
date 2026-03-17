import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Activity, Download, Upload, Search, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { ActivityLog } from '../types';
import { formatDate } from '../lib/utils';

export function AdminDashboard() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.admin.getActivityLogs();
        setLogs(res.logs || []);
      } catch (err) {
        console.error('Failed to fetch logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleExport = async () => {
    try {
      const data = await api.admin.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `envisionpaths_export_${new Date().toISOString()}.json`;
      a.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  const filteredLogs = logs.filter(log => 
    log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.activity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-32 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="text-red-500 text-[8px] font-black uppercase tracking-widest">
              System Administration
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none italic">
            Admin <span className="text-red-600">Control Panel</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl flex items-center gap-2 transition-all"
          >
            <Download size={14} />
            Export Data
          </button>
          <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl flex items-center gap-2 transition-all">
            <Upload size={14} />
            Import Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <Users className="text-red-500" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Users</span>
          </div>
          <p className="text-4xl font-black italic">1,284</p>
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">+12% this week</p>
        </div>
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <Activity className="text-red-500" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Active Sessions</span>
          </div>
          <p className="text-4xl font-black italic">42</p>
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Live Now</p>
        </div>
        <div className="bg-[#111] border border-white/5 p-8 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <Shield className="text-red-500" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">System Health</span>
          </div>
          <p className="text-4xl font-black italic">99.9%</p>
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">All Systems Operational</p>
        </div>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
            <Activity size={20} className="text-red-500" />
            Activity Logs
          </h3>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="bg-white/5 border border-white/10 rounded-full py-2 pl-12 pr-6 text-xs focus:outline-none focus:border-red-500 transition-colors w-full md:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">User</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Activity</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Location</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">IP Address</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-gray-600">
                    <p className="text-xs uppercase font-black tracking-widest">No logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-white">{log.email}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-gray-400 uppercase font-black tracking-widest">{log.activity}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-gray-400">{log.country}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-mono text-gray-500">{log.ip_address}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
