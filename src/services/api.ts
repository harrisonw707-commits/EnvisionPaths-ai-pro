import { User, Simulation, Message, Reminder, ActivityLog } from '../types';

const API_BASE = '/api';

export const api = {
  auth: {
    signup: (email: string, password: string) => 
      fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(res => res.json()),

    login: (email: string, password: string) => 
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }).then(res => res.json()),

    logout: () => 
      fetch(`${API_BASE}/auth/logout`, { method: 'POST' }).then(res => res.json()),

    getProfile: () => 
      fetch(`${API_BASE}/user/profile`).then(res => res.json()),
  },

  simulations: {
    start: (job_title: string, industry: string) => 
      fetch(`${API_BASE}/simulations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title, industry })
      }).then(res => res.json()),

    complete: (data: { 
      simulation_id: number, 
      job_title: string, 
      industry: string, 
      score: number, 
      feedback: string, 
      messages: Message[] 
    }) => 
      fetch(`${API_BASE}/simulations/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),

    getHistory: () => 
      fetch(`${API_BASE}/simulations/history`).then(res => res.json()),

    getMessages: (id: number) => 
      fetch(`${API_BASE}/simulations/${id}/messages`).then(res => res.json()),

    reportGlitch: (simulation_id: number, reason: string) => 
      fetch(`${API_BASE}/simulations/report-glitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulation_id, reason })
      }).then(res => res.json()),
  },

  reminders: {
    list: () => fetch(`${API_BASE}/reminders`).then(res => res.json()),
    create: (reminder: Partial<Reminder>) => 
      fetch(`${API_BASE}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder)
      }).then(res => res.json()),
    update: (id: number, completed: boolean) => 
      fetch(`${API_BASE}/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      }).then(res => res.json()),
    delete: (id: number) => 
      fetch(`${API_BASE}/reminders/${id}`, { method: 'DELETE' }).then(res => res.json()),
  },

  ai: {
    generate: (model: string, payload: any) => 
      fetch(`${API_BASE}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, payload })
      }).then(res => res.json()),
  },

  stripe: {
    createCheckoutSession: (plan_type: string) => 
      fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type })
      }).then(res => res.json()),
    verifySession: (session_id: string) => 
      fetch(`${API_BASE}/verify-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      }).then(res => res.json()),
  },

  admin: {
    getActivityLogs: () => fetch(`${API_BASE}/admin/activity-logs`).then(res => res.json()),
    exportData: () => fetch(`${API_BASE}/admin/export-data`).then(res => res.json()),
    importData: (data: any) => 
      fetch(`${API_BASE}/admin/import-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
  }
};
