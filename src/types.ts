export interface User {
  id: number;
  email: string;
  plan_type: 'free' | 'beginner' | 'pro' | 'elite';
  plan_start_date?: string;
  is_admin: boolean;
  simulations_this_month?: number;
}

export interface Simulation {
  id: number;
  job_title: string;
  industry: string;
  score?: number;
  feedback?: string;
  status: 'started' | 'completed' | 'glitched';
  created_at: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: string;
}

export interface Reminder {
  id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  completed: boolean;
}

export interface ActivityLog {
  id: number;
  email: string;
  activity: string;
  country: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}
