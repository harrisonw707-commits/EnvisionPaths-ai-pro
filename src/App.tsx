/**
 * EnvisionPaths - Smart Interview Preparation Platform
 * 
 * This application provides a comprehensive suite of tools for job seekers:
 * - Real-time Interactive Practice Sessions (Text & Voice)
 * - Personalized Performance Feedback & Scoring
 * - Practice Session Scheduling & Reminders
 * - Subscription Management & Secure Payments
 * - User Profile & Security Settings
 * 
 * Built with: React, Tailwind CSS, Motion, Lucide Icons, and Gemini AI.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  CreditCard,
  Download,
  HardHat,
  Factory,
  Truck,
  Zap,
  Utensils,
  Monitor,
  Trash2,
  DollarSign,
  Stethoscope,
  Shield,
  Megaphone,
  Sprout,
  Car,
  Siren,
  Wrench,
  Clock,
  History,
  Search,
  Activity,
  ShieldCheck,
  ExternalLink,
  Upload,
  FileText,
  ChevronDown,
  Mic,
  Keyboard,
  Settings,
  HelpCircle,
  AlertCircle,
  Info,
  X,
  Copy,
  BarChart as BarChartIcon,
  Globe,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import { generateContent, generateSpeech } from './services/aiService';
import { Tooltip } from './components/Tooltip';
import { Modal } from './components/Modal';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

type AppStep = 'auth' | 'pricing' | 'setup' | 'interview' | 'summary' | 'admin';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const VoiceVisualizer = () => (
  <div className="flex items-end gap-0.5 h-3">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="w-0.5 bg-emerald-400 rounded-full"
        animate={{
          height: ["20%", "60%", "40%", "100%", "30%"][i],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.1,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);



export default function App() {
  const [step, setStep] = useState<AppStep>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'beginner' | 'pro' | 'elite' | null>(null);
  const [sessionsUsed, setSessionsUsed] = useState(0);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [updateEmailValue, setUpdateEmailValue] = useState('');
  const [currentPasswordValue, setCurrentPasswordValue] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [lastAlertCount, setLastAlertCount] = useState<number>(0);
  const [isAnnual, setIsAnnual] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [currentSimulationId, setCurrentSimulationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkipLoading, setShowSkipLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'email'>('totp');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isEnhancingResume, setIsEnhancingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<'text' | 'voice'>('text');
  const [isListening, setIsListening] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  
  // Interview tracking state
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [interviewLength, setInterviewLength] = useState(5);

  // Reminders state
  const [reminders, setReminders] = useState<any[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSchedulingLoading, setIsSchedulingLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<'overview' | 'stats' | 'debug'>('overview');
  const [debugLogs, setDebugLogs] = useState<{ name: string; params: any; timestamp: Date }[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null);
  const [simulationMessages, setSimulationMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDesc, setReminderDesc] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  }, [theme]);

  const [isTesterGuideOpen, setIsTesterGuideOpen] = useState(false);
  const [lastUpdated] = useState('2026-03-16 16:52 UTC');

  // Debug check for API key
  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("[Debug] AI Configuration:", {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
      env: process.env.NODE_ENV
    });
  }, []);
  const [lastChecked, setLastChecked] = useState(new Date().toLocaleString());
  const [authError, setAuthError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'dummy-key') {
      console.warn('[SYSTEM] Gemini API Key is missing or invalid.');
    } else {
      console.log('[SYSTEM] Gemini API Key detected and loaded.');
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (isTyping) {
      timer = setTimeout(() => setShowRetry(true), 10000);
    } else {
      setShowRetry(false);
    }
    return () => clearTimeout(timer);
  }, [isTyping]);


  const [loginError, setLoginError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    showInput?: boolean;
    inputPlaceholder?: string;
    onConfirm: (inputValue?: string) => void 
  } | null>(null);
  const [modalInputValue, setModalInputValue] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${message}`);
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      showNotification('Notifications are not supported on this device.', 'error');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showNotification('System notifications enabled!', 'success');
      } else if (permission === 'denied') {
        showNotification('Notifications were blocked. Please enable them in your browser settings.', 'error');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const navigate = (path: string) => {
    console.log(`[NAVIGATE] to: ${path}`);
    if (path === '/admin/dashboard') {
      setStep('admin');
    } else if (path === '/') {
      setStep('auth');
    } else if (path === '/pricing') {
      setStep('pricing');
    }
  };

  const trackEvent = (name: string, params?: any) => {
    if (window.gtag) {
      window.gtag('event', name, params);
    }
    setDebugLogs(prev => [{ name, params, timestamp: new Date() }, ...prev].slice(0, 50));
    console.log(`[GA4 EVENT]: ${name}`, params);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('Message copied to clipboard', 'success');
  };

  const exportTranscript = () => {
    const transcript = `ENVISIONPATHS INTERVIEW TRANSCRIPT
==================================================
Position: ${jobTitle}
Industry: ${industry}
Candidate: ${user?.email || 'Guest User'}
Date: ${new Date().toLocaleString()}
==================================================

${messages.map(msg => {
  const role = msg.role === 'user' ? 'CANDIDATE' : 'COACH';
  const ts = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
  const time = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `[${time}] ${role}:
${msg.text}
`;
}).join('\n--------------------------------------------------\n\n')}

==================================================
Generated by EnvisionPaths Career Intelligence
Professional Interview Simulation Platform
==================================================`;

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Interview_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReport = () => {
    const report = `ENVISIONPATHS PERFORMANCE REPORT
Position: ${jobTitle}
Industry: ${industry}
Date: ${new Date().toLocaleDateString()}
--------------------------------------------------

${summary}

--------------------------------------------------
Generated by EnvisionPaths Career Intelligence`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Report_${jobTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const suggestedRoles: Record<string, string[]> = {
    'Construction': ['Site Supervisor', 'Electrician', 'Plumber', 'HVAC Technician', 'Heavy Equipment Operator', 'Carpenter', 'Mason', 'Ironworker', 'Surveyor', 'Project Coordinator', 'Drywaller', 'Roofer', 'Pipefitter', 'Crane Operator', 'General Laborer', 'Construction Assistant', 'Painter', 'Flooring Installer', 'Scaffolder'],
    'Manufacturing': ['Production Manager', 'Quality Control Inspector', 'CNC Machinist', 'Welder', 'Assembly Line Lead', 'Safety Coordinator', 'Millwright', 'Industrial Electrician', 'Tool and Die Maker', 'Maintenance Mechanic', 'Forklift Operator', 'Machine Operator', 'Production Worker', 'Packer', 'Inventory Clerk', 'Material Handler'],
    'Logistics': ['Warehouse Manager', 'Fleet Supervisor', 'Supply Chain Coordinator', 'Forklift Driver', 'Picker Packer', 'Inventory Specialist', 'Delivery Lead', 'Dispatcher', 'Logistics Analyst', 'Operations Lead', 'Truck Driver (CDL)', 'Warehouse Associate', 'Delivery Driver', 'Stock Clerk', 'Route Driver', 'Shipping Clerk'],
    'Energy': ['Solar Panel Installer', 'Wind Turbine Technician', 'Power Plant Operator', 'Utility Lineworker', 'Field Engineer', 'Safety Officer', 'Drilling Supervisor', 'Pipefitter', 'Geologist', 'Instrumentation Tech', 'Lineman', 'Substation Technician', 'Meter Reader', 'Energy Auditor', 'Waste Management Tech'],
    'Hospitality': ['Executive Chef', 'Line Cook', 'Prep Cook', 'Hotel Manager', 'Front Desk Supervisor', 'Maintenance Lead', 'Janitor', 'Housekeeping Manager', 'Sous Chef', 'Event Coordinator', 'Bartender', 'Server', 'Dishwasher', 'Cashier', 'Host/Hostess', 'Concierge', 'Valet', 'Laundry Attendant'],
    'Technology': ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UI/UX Designer', 'IT Support Specialist', 'Cybersecurity Analyst', 'Cloud Architect', 'Help Desk Technician', 'QA Tester', 'Technical Support', 'Web Developer', 'Systems Admin', 'Vertex AI User'],
    'Finance': ['Investment Banker', 'Financial Analyst', 'Accountant', 'Risk Manager', 'Portfolio Manager', 'Loan Officer', 'Tax Specialist', 'Auditor', 'Bank Teller', 'Collections Specialist', 'Bookkeeper', 'Billing Clerk', 'Insurance Agent'],
    'Healthcare': ['Registered Nurse', 'Medical Assistant', 'Healthcare Administrator', 'Lab Technician', 'Physical Therapist', 'Pharmacist', 'Dental Hygienist', 'Radiologic Tech', 'Patient Care Tech', 'Home Health Aide', 'Phlebotomist', 'Medical Coder', 'Pharmacy Tech'],
    'Defense': ['Aerospace Engineer', 'Systems Analyst', 'Project Manager', 'Security Specialist', 'Logistics Analyst', 'Technical Writer', 'Intelligence Analyst', 'Contract Administrator', 'Operations Research', 'Facility Manager'],
    'Marketing': ['Marketing Manager', 'Content Strategist', 'SEO Specialist', 'Brand Manager', 'Social Media Lead', 'Digital Analyst', 'Copywriter', 'Public Relations', 'Marketing Assistant', 'Event Staff', 'Media Buyer', 'Graphic Designer'],
    'Agriculture': ['Farm Manager', 'Agricultural Mechanic', 'Greenhouse Supervisor', 'Irrigation Specialist', 'Livestock Manager', 'Crop Consultant', 'Harvester', 'Tractor Operator', 'Farm Hand', 'Nursery Worker', 'Beekeeper', 'Soil Scientist'],
    'Automotive': ['Service Manager', 'Master Technician', 'Body Shop Lead', 'Parts Coordinator', 'Fleet Mechanic', 'Diagnostic Specialist', 'Tire Technician', 'Diesel Mechanic', 'Lube Technician', 'Car Detailer', 'Service Advisor', 'Lot Attendant'],
    'PublicSafety': ['Fire Captain', 'Police Sergeant', 'EMS Supervisor', '911 Dispatcher', 'Security Manager', 'Emergency Coordinator', 'Parole Officer', 'Correctional Officer', 'Security Guard', 'Loss Prevention', 'Animal Control', 'Bailiff'],
    'GeneralServices': ['Janitor', 'Security Guard', 'Customer Service', 'Retail Associate', 'Stock Clerk', 'Groundskeeper', 'Maintenance Worker', 'Custodian', 'Pest Control Tech', 'Housekeeper', 'Office Assistant', 'Receptionist', 'Data Entry Clerk', 'Personal Assistant', 'Virtual Assistant']
  };

  const industryIcons: Record<string, any> = {
    'Construction': HardHat,
    'Manufacturing': Factory,
    'Logistics': Truck,
    'Energy': Zap,
    'Hospitality': Utensils,
    'Technology': Monitor,
    'Finance': DollarSign,
    'Healthcare': Stethoscope,
    'Defense': Shield,
    'Marketing': Megaphone,
    'Agriculture': Sprout,
    'Automotive': Car,
    'PublicSafety': Siren,
    'GeneralServices': Wrench
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
    if (step === 'setup') {
      fetchReminders();
    }
  }, [step]);

  // Background check for upcoming reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (!reminder.completed) {
          const scheduledTime = new Date(reminder.scheduled_at);
          const diff = scheduledTime.getTime() - now.getTime();
          console.log(`[REMINDER] Checking "${reminder.title}": diff=${diff}ms`);
          
          // If reminder is due within the next minute and hasn't been notified yet
          if (diff > -30000 && diff < 60000) {
            console.log(`[REMINDER] Triggering alert for: ${reminder.title}`);
            showNotification(`REMINDER: ${reminder.title} is starting soon!`, 'success');
            
            // System notification for background alerts
            if (notificationPermission === 'granted') {
              try {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('EnvisionPaths Reminder', {
                      body: `${reminder.title} is starting soon!`,
                      icon: '/icons/icon-192x192.png',
                      badge: '/icons/icon-192x192.png',
                      vibrate: [200, 100, 200],
                      tag: `reminder-${reminder.id}`
                    } as any);
                  });
                } else {
                  new Notification('EnvisionPaths Reminder', {
                    body: `${reminder.title} is starting soon!`,
                    icon: '/icons/icon-192x192.png'
                  });
                }
              } catch (e) {
                console.error('Failed to show system notification:', e);
              }
            }
            
            // Mark as completed so we don't alert again
            toggleReminder(reminder.id, false);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds for better accuracy
    return () => clearInterval(interval);
  }, [reminders]);

  const fetchReminders = async () => {
    try {
      const res = await fetch(API_URL + '/api/reminders', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders);
      }
    } catch (e) {
      console.error('Error fetching reminders:', e);
    }
  };

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSchedulingLoading) return;
    
    setIsSchedulingLoading(true);
    console.log('[REMINDER] Adding reminder:', { reminderTitle, reminderDate, reminderTime });
    try {
      const scheduled_at = `${reminderDate}T${reminderTime}:00`; 
      const res = await fetch(API_URL + '/api/reminders', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: reminderTitle, description: reminderDesc, scheduled_at })
      });
      if (res.ok) {
        console.log('[REMINDER] Reminder added successfully');
        setReminderTitle('');
        setReminderDate('');
        setReminderTime('');
        setReminderDesc('');
        setIsScheduling(false);
        fetchReminders();
        showNotification('Practice session scheduled!', 'success');
      } else {
        const err = await res.json();
        console.error('[REMINDER] Failed to add reminder:', err);
        showNotification('Failed to schedule session.', 'error');
      }
    } catch (e) {
      console.error('Error adding reminder:', e);
      showNotification('An error occurred while scheduling.', 'error');
    } finally {
      setIsSchedulingLoading(false);
    }
  };

  const toggleReminder = async (id: number, completed: boolean) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      if (res.ok) {
        fetchReminders();
      }
    } catch (e) {
      console.error('Error toggling reminder:', e);
    }
  };

  const deleteReminder = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchReminders();
      }
    } catch (e) {
      console.error('Error deleting reminder:', e);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      console.log('[APP] Starting session check...');
      console.log('[APP] Current localStorage session_id:', localStorage.getItem('session_id'));
      console.log('[APP] Current URL:', window.location.href);
      
      // Show skip button after 1.5 seconds
      const skipTimeoutId = setTimeout(() => {
        console.log('[APP] Skip loading button triggered');
        setShowSkipLoading(true);
      }, 1500);

      // Safety timeout: force loading to false after 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('[APP] Session check timed out, forcing loading to false');
        setIsLoading(false);
      }, 3000);

      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const planType = urlParams.get('plan_type');

      if (sessionId) {
        try {
          const verifyRes = await fetch(API_URL + '/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              session_id: sessionId
            })
          });
          if (verifyRes.ok) {
            const contentType = verifyRes.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await verifyRes.json();
              setSelectedPlan(data.plan_type);
              trackEvent('plan_unlocked', { plan: data.plan_type });
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (e) {
          console.error('Verification failed');
        }
      }

      try {
        console.log('[APP] Fetching user profile...');
        const user = await fetchProfile();
        console.log('[APP] Profile fetch result:', user ? 'User found' : 'No user');
        if (user) {
          // Only set step to setup if we're currently on auth
          setStep(prev => prev === 'auth' ? 'setup' : prev);
          fetchHistory();
        } else {
          console.log('[APP] No active session found');
        }
      } catch (e) {
        console.error('[APP] Session check failed', e);
      } finally {
        console.log('[APP] Cleaning up session check...');
        clearTimeout(timeoutId);
        clearTimeout(skipTimeoutId);
        setIsLoading(false);
        console.log('[APP] Session check complete');
      }
    };
    checkSession();
  }, []);

  const getAuthHeaders = (existingHeaders: Record<string, string> = {}) => {
    const sessionId = localStorage.getItem('session_id');
    const headers: Record<string, string> = { ...existingHeaders };
    if (sessionId) headers['x-session-id'] = sessionId;
    return headers;
  };

  const fetchActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(API_URL + '/api/admin/activity-logs', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs);
      }
      
      const resSims = await fetch(API_URL + '/api/admin/export-data', { headers: getAuthHeaders() });
      if (resSims.ok) {
        const data = await resSims.json();
        setSimulations(data.simulations);
        setAdminUsers(data.users || []);
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const exportActivityLogs = () => {
    if (activityLogs.length === 0) return;
    const headers = ['ID', 'Email', 'Activity', 'Country', 'IP Address', 'User Agent', 'Time'];
    const rows = activityLogs.map(log => [
      log.id,
      log.email,
      log.activity,
      log.country,
      log.ip_address,
      log.user_agent,
      new Date(log.created_at).toISOString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `EnvisionPaths_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const syncPlayConsoleData = async () => {
    if (!confirm('This will sync historical data from Google Play Console. Continue?')) return;
    
    setIsImporting(true);
    try {
      const activity_logs: any[] = [];
      
      // Data from Play Console Screenshots
      const playData = [
        { date: '2026-03-04', total: 4, countries: { 'Argentina': 1 } },
        { date: '2026-03-05', total: 7, countries: { 'Argentina': 1 } },
        { date: '2026-03-06', total: 7, countries: { 'Singapore': 2, 'United Kingdom': 3 } },
        { date: '2026-03-07', total: 9, countries: { 'Argentina': 3, 'Singapore': 2, 'United Kingdom': 1, 'Italy': 1 } },
        { date: '2026-03-11', total: 26, countries: { 'Argentina': 2, 'Singapore': 1, 'United Kingdom': 3, 'Italy': 2, 'Türkiye': 4, 'United States': 3, 'Australia': 2, 'Monaco': 1, 'Morocco': 1, 'South Africa': 1, 'Colombia': 1 } },
        { date: '2026-03-12', total: 26, countries: { 'Argentina': 2, 'Singapore': 1, 'United Kingdom': 3, 'Italy': 2, 'Türkiye': 4, 'United States': 3, 'Australia': 2, 'Monaco': 1, 'Morocco': 1, 'South Africa': 1, 'Colombia': 1 } }
      ];

      playData.forEach(day => {
        let count = 0;
        // Add specific country logs
        Object.entries(day.countries).forEach(([country, num]) => {
          for (let i = 0; i < num; i++) {
            activity_logs.push({
              activity: 'session_start',
              country,
              created_at: `${day.date}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
              email: 'play-console-user@envisionpaths.com'
            });
            count++;
          }
        });
        
        // Add "Others" logs to match total
        const others = day.total - count;
        for (let i = 0; i < others; i++) {
          activity_logs.push({
            activity: 'session_start',
            country: 'Other',
            created_at: `${day.date}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
            email: 'play-console-user@envisionpaths.com'
          });
        }
      });

      // Add Device Acquisitions (39 total)
      for (let i = 0; i < 39; i++) {
        const randomDay = playData[Math.floor(Math.random() * playData.length)].date;
        activity_logs.push({
          activity: 'device_acquisition',
          country: 'Unknown',
          created_at: `${randomDay}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
          email: 'new-device@envisionpaths.com'
        });
      }

      // Add First Opens (18 total)
      for (let i = 0; i < 18; i++) {
        const randomDay = playData[Math.floor(Math.random() * playData.length)].date;
        activity_logs.push({
          activity: 'first_open',
          country: 'Unknown',
          created_at: `${randomDay}T${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00Z`,
          email: 'first-open@envisionpaths.com'
        });
      }

      const res = await fetch(API_URL + '/api/admin/import-data', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_logs })
      });

      if (res.ok) {
        showNotification('Play Console data synced successfully!', 'success');
        fetchActivityLogs();
      } else {
        showNotification('Failed to sync Play Console data.', 'error');
      }
    } catch (e) {
      console.error('Error syncing Play Console data:', e);
      showNotification('Error syncing data.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const exportAllData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(API_URL + '/api/admin/export-data', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `EnvisionPaths_Full_Export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Error exporting data:', e);
      alert('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const importAllData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let data: any;

      // Check if it's JSON or CSV
      const trimmedText = text.trim();
      const firstLine = trimmedText.split('\n')[0].toLowerCase();
      const isCsv = (trimmedText.includes(',') || trimmedText.includes(';') || trimmedText.includes('\t')) && 
                    (firstLine.includes('activity') || firstLine.includes('email') || firstLine.includes('country') || 
                     firstLine.includes('job') || firstLine.includes('title') || firstLine.includes('industry') || 
                     firstLine.includes('score') || firstLine.includes('status') || firstLine.includes('event'));

      if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
        data = JSON.parse(text);
      } else if (isCsv) {
        // Simple CSV Parser
        const delimiter = trimmedText.includes('\t') ? '\t' : (trimmedText.includes(';') ? ';' : ',');
        const lines = trimmedText.split('\n').filter(line => line.trim().length > 0);
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, '').toLowerCase());
        
        const records = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
          const item: any = {};
          headers.forEach((header, index) => {
            // Mapping for Activity Logs
            if (header.includes('email')) item.email = values[index];
            if (header.includes('activity') || header.includes('event')) item.activity = values[index];
            if (header.includes('country')) item.country = values[index];
            if (header.includes('ip')) item.ip_address = values[index];
            if (header.includes('agent')) item.user_agent = values[index];
            
            // Mapping for Simulations
            if (header.includes('email')) item.email = values[index];
            if (header.includes('job')) item.job_title = values[index];
            if (header.includes('industry')) item.industry = values[index];
            if (header.includes('score')) item.score = parseInt(values[index]) || 0;
            if (header.includes('feedback')) item.feedback = values[index];
            if (header.includes('status')) item.status = values[index];

            // Common
            if (header.includes('time') || header.includes('date')) item.created_at = values[index];
          });
          return item;
        });
        
        // Determine if these are logs or simulations
        if (headers.some(h => h.includes('job') || h.includes('industry') || h.includes('score'))) {
          data = { simulations: records };
        } else {
          data = { activity_logs: records };
        }
        console.log('[Import] Parsed CSV data:', data);
      } else {
        throw new Error("Unrecognized file format. Please upload the .json export file or a valid activity/simulation CSV.");
      }
      
      const res = await fetch(API_URL + '/api/admin/import-data', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        alert('Data imported successfully!');
        fetchActivityLogs();
      } else {
        const err = await res.json();
        alert(`Import failed: ${err.error}`);
      }
    } catch (e: any) {
      console.error('Error importing data:', e);
      alert(`Error importing data:\n${e.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const downloadLogsCSV = () => {
    if (activityLogs.length === 0) return;
    
    const headers = ['ID', 'Email', 'Activity', 'Country', 'IP Address', 'User Agent', 'Time'];
    const rows = activityLogs.map(log => [
      log.id,
      log.email,
      log.activity,
      log.country,
      log.ip_address,
      `"${log.user_agent?.replace(/"/g, '""') || ''}"`,
      new Date(log.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadSimulationsCSV = () => {
    if (simulations.length === 0) return;
    
    const headers = ['ID', 'User ID', 'Email', 'Job Title', 'Industry', 'Score', 'Status', 'Time'];
    const rows = simulations.map(sim => [
      sim.id,
      sim.user_id,
      sim.email || 'N/A',
      `"${sim.job_title?.replace(/"/g, '""') || ''}"`,
      `"${sim.industry?.replace(/"/g, '""') || ''}"`,
      sim.score,
      sim.status,
      new Date(sim.created_at).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EnvisionPaths_Simulations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatsData = () => {
    const countryData: Record<string, number> = {};
    const dailyData: Record<string, Record<string, number>> = {};
    const allDates = new Set<string>();
    const allCountries = new Set<string>();

    activityLogs.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const country = log.country || 'Unknown';
      
      allDates.add(date);
      allCountries.add(country);

      countryData[country] = (countryData[country] || 0) + 1;
      
      if (!dailyData[date]) dailyData[date] = {};
      dailyData[date][country] = (dailyData[date][country] || 0) + 1;
      dailyData[date]['total'] = (dailyData[date]['total'] || 0) + 1;
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const sortedCountries = Array.from(allCountries).sort((a, b) => countryData[b] - countryData[a]);

    const chartData = sortedCountries.slice(0, 10).map(country => ({
      name: country,
      value: countryData[country]
    }));

    const tableData = sortedDates.map(date => ({
      date,
      total: dailyData[date]['total'] || 0,
      countries: sortedCountries.reduce((acc, country) => {
        acc[country] = dailyData[date][country] || 0;
        return acc;
      }, {} as Record<string, number>)
    }));

    return { chartData, tableData, countries: sortedCountries };
  };

  useEffect(() => {
    if (step === 'admin') {
      fetchActivityLogs();
    }
  }, [step]);

  const fetchProfile = async () => {
    console.log('[APP] fetchProfile called');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const headers = getAuthHeaders();
      console.log('[APP] fetchProfile headers:', headers);
      const res = await fetch(API_URL + '/api/user/profile', { 
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('[APP] fetchProfile response status:', res.status);
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          console.log('[APP] fetchProfile data:', data);
          setUser(data.user);
          setSelectedPlan(data.user.plan_type);
          setSessionsUsed(data.user.simulations_this_month);
          setIsAdmin(!!data.user.is_admin);
          setTwoFactorEnabled(!!data.user.two_factor_enabled);
          return data.user;
        } else {
          console.error('[APP] Profile fetch returned non-JSON response');
        }
      } else if (res.status === 401) {
        console.warn('[APP] Profile fetch 401 - Session invalid, clearing localStorage');
        localStorage.removeItem('session_id');
      } else {
        const errorText = await res.text();
        console.error('[APP] Profile fetch failed:', res.status, errorText);
      }
    } catch (e) {
      console.error('[APP] Error fetching profile:', e);
    }
    return null;
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(API_URL + '/api/simulations/history', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (e) {
      console.error('Failed to fetch history');
    }
  };

  const fetchSimulationMessages = async (simulationId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/api/simulations/${simulationId}/messages`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSimulationMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Failed to fetch simulation messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(API_URL + '/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });
      const data = await response.json();
      if (data.success) {
        setResetUserId(data.userId);
        setResetStep('code');
        setAuthError(null);
      } else {
        setAuthError(data.error || 'Failed to initiate password reset.');
      }
    } catch (err) {
      setAuthError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(API_URL + '/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, code: resetCode })
      });
      const data = await response.json();
      if (data.success) {
        setResetStep('password');
        setAuthError(null);
      } else {
        setAuthError(data.error || 'Invalid or expired reset code.');
      }
    } catch (err) {
      setAuthError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(API_URL + '/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUserId, code: resetCode, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        setShowForgotPasswordForm(false);
        setResetStep('email');
        setAuthMode('login');
        setAuthError('Password reset successful. Please login with your new password.');
        setForgotPasswordEmail('');
        setResetCode('');
        setNewPassword('');
      } else {
        setAuthError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setAuthError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailCode = async () => {
    if (!tempUserId) return;
    setIsSendingCode(true);
    try {
      const res = await fetch(API_URL + '/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId })
      });
      if (res.ok) {
        setEmailCodeSent(true);
      }
    } catch (e) {
      console.error('Failed to send email code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handle2FALogin = async (e: React.FormEvent, bypassCode?: string) => {
    e.preventDefault();
    const codeToUse = bypassCode || twoFactorCode;
    if (!codeToUse || !tempUserId) return;

    try {
      const res = await fetch(API_URL + '/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, code: codeToUse, method: twoFactorMethod })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.sessionId) {
          localStorage.setItem('session_id', data.sessionId);
        }
        setUser(data.user);
        setSelectedPlan(data.user.plan_type);
        setIsAdmin(!!data.user.is_admin);
        setRequires2FA(false);
        setTempUserId(null);
        setTwoFactorCode('');
        setStep('setup');
        fetchHistory();
      } else {
        setAuthError(data.error || 'Invalid verification code');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const setup2FA = async () => {
    try {
      const res = await fetch(API_URL + '/api/auth/setup-2fa', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setQrCodeUrl(data.qrCodeUrl);
        setIsSettingUp2FA(true);
      } else {
        alert(data.error || 'Failed to initiate 2FA setup');
      }
    } catch (e) {
      console.error('2FA setup error:', e);
    }
  };

  const verify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL + '/api/auth/verify-2fa', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ code: setupCode })
      });
      if (res.ok) {
        setTwoFactorEnabled(true);
        setIsSettingUp2FA(false);
        setSetupCode('');
        alert('Two-factor authentication enabled successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Invalid verification code');
      }
    } catch (e) {
      console.error('2FA verification error:', e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Client-side email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    const endpoint = authMode === 'signup' ? API_URL + '/api/auth/signup' : API_URL + '/api/auth/login';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Auth error response:', text.substring(0, 100));
        setAuthError('Server error. Please try again later.');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        if (data.requires_2fa) {
          setRequires2FA(true);
          setTempUserId(data.userId);
          setTwoFactorMethod(data.method || 'totp');
          return;
        }
        if (data.sessionId) {
          localStorage.setItem('session_id', data.sessionId);
        }
        setSelectedPlan(data.user.plan_type);
        setIsAdmin(!!data.user.is_admin);
        setUser(data.user);
        if (authMode === 'signup') {
          trackEvent('signup_success', { email, plan_type: data.user.plan_type });
          setStep('pricing');
        } else {
          trackEvent('login_success', { email, is_admin: data.user.is_admin });
          setStep('setup');
          fetchHistory();
        }
      } else {
        trackEvent(authMode === 'signup' ? 'signup_failed' : 'login_failed', { email, error: data.error });
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const reportGlitch = () => {
    if (!currentSimulationId) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Report Glitch',
      message: 'Did the system glitch or fail to respond correctly? This will end the session and refund your simulation credit.',
      showInput: true,
      inputPlaceholder: 'Briefly describe what happened (optional)',
      onConfirm: async (reason?: string) => {
        try {
          const res = await fetch(API_URL + '/api/simulations/report-glitch', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ 
              simulation_id: currentSimulationId,
              reason: reason
            })
          });

          if (res.ok) {
            showNotification("Glitch reported. Your session has been refunded.", 'success');
            setStep('setup');
            setCurrentSimulationId(null);
            setMessages([]);
            fetchProfile();
          } else {
            const data = await res.json();
            showNotification(data.error || "Failed to report glitch.", 'error');
          }
        } catch (e) {
          console.error("Error reporting glitch:", e);
          showNotification("An error occurred while reporting the glitch.", 'error');
        }
      }
    });
  };
  const handleLogout = async () => {
    trackEvent('logout');
    localStorage.removeItem('session_id');
    try {
      await fetch(API_URL + '/api/auth/logout', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      console.error('[AUTH] Logout API call failed:', e);
    }
    setEmail('');
    setPassword('');
    setStep('auth');
    setAuthMode('login');
    setSelectedPlan(null);
    setHistory([]);
    setIsAdmin(false);
    setTwoFactorEnabled(false);
    setRequires2FA(false);
    setTempUserId(null);
    setTwoFactorCode('');
    setTwoFactorMethod('totp');
    setEmailCodeSent(false);
    setSessionsUsed(0);
    setMessages([]);
    setJobTitle('');
    setIndustry('');
    setCurrentSimulationId(null);
    setSummary('');
    setAuthError(null);
    setLoginError(null);
    setUser(null);
    setIsSettingsOpen(false);
  };

  const handleDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you absolutely sure? This will permanently delete your account and all your practice history. This action cannot be undone.',
      onConfirm: async () => {
        setIsDeletingAccount(true);
        try {
          const res = await fetch(API_URL + '/api/user/account', {
            method: 'DELETE',
            headers: getAuthHeaders()
          });

          if (res.ok) {
            localStorage.removeItem('session_id');
            setUser(null);
            setStep('auth');
            setIsSettingsOpen(false);
            showNotification('Your account has been successfully deleted.', 'success');
          } else {
            const data = await res.json();
            showNotification(data.error || 'Failed to delete account', 'error');
          }
        } catch (e) {
          showNotification('Network error. Please try again.', 'error');
        } finally {
          setIsDeletingAccount(false);
        }
      }
    });
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateEmailValue) return;
    setIsUpdatingEmail(true);
    setUpdateMessage(null);
    try {
      const res = await fetch(API_URL + '/api/user/email', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEmail: updateEmailValue })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...user, email: updateEmailValue });
        setUpdateMessage({ type: 'success', text: 'Email updated successfully' });
        setUpdateEmailValue('');
      } else {
        setUpdateMessage({ type: 'error', text: data.error || 'Failed to update email' });
      }
    } catch (e) {
      setUpdateMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordValue || !newPasswordValue) return;
    setIsUpdatingPassword(true);
    setUpdateMessage(null);
    try {
      const res = await fetch(API_URL + '/api/user/password', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          currentPassword: currentPasswordValue,
          newPassword: newPasswordValue 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateMessage({ type: 'success', text: 'Password updated successfully' });
        setCurrentPasswordValue('');
        setNewPasswordValue('');
      } else {
        setUpdateMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (e) {
      setUpdateMessage({ type: 'error', text: 'Network error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const selectPlan = async (plan: 'beginner' | 'pro') => {
    // Get current user profile to get the ID
    setAuthError(null);
    try {
      const profileRes = await fetch(API_URL + '/api/user/profile', { headers: getAuthHeaders() });
      if (!profileRes.ok) throw new Error('Not authenticated');
      
      const contentType = profileRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await profileRes.text();
        console.error('Expected JSON but got:', text.substring(0, 100));
        throw new Error('Server returned invalid response format');
      }

      const { user } = await profileRes.json();

      // Stripe Payment Links (Replace with your actual links from Stripe Dashboard)
      const paymentLinks: Record<string, string> = {
        beginner: 'https://buy.stripe.com/28EaEY5Is6bfbmxa139R608',
        pro: 'https://buy.stripe.com/cNi14o2wg9nr76h2yB9R609'
      };

      const link = paymentLinks[plan];
      
      // Pass client_reference_id to identify the user in the webhook/redirect
      const checkoutUrl = new URL(link);
      checkoutUrl.searchParams.set('client_reference_id', user.id.toString());
      if (user.email) {
        checkoutUrl.searchParams.set('prefilled_email', user.email);
      }
      
      trackEvent('upgrade_clicked', { plan });
      
      // Use window.open to avoid iframe blocking issues (Stripe blocks iframe loading)
      const win = window.open(checkoutUrl.toString(), '_blank');
      if (!win) {
        // Fallback if popup is blocked
        window.location.href = checkoutUrl.toString();
      }
    } catch (e) {
      console.error('Upgrade error:', e);
      setAuthError('Please sign in to upgrade. If you are signed in, check your connection.');
      setStep('auth');
    }
  };

  const endInterview = () => {
    if (questionsAnswered < interviewLength && questionsAnswered > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'End Session?',
        message: `You have answered ${questionsAnswered} questions. Would you like to end the session and generate your performance report now, or just exit?`,
        onConfirm: () => {
          setStep('summary');
          setIsGeneratingSummary(true);
          generateSummary();
        }
      });
      return;
    } else if (questionsAnswered === 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Exit Session?',
        message: 'You haven\'t answered any questions yet. Are you sure you want to exit?',
        onConfirm: () => {
          setStep('setup');
          setMessages([]);
          setSummary('');
        }
      });
      return;
    }

    setStep('summary');
    setIsGeneratingSummary(true);
    generateSummary();
  };

  const generateSummary = async () => {
    try {
      const conversation = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
      const isFree = !selectedPlan || selectedPlan === 'free';
      const prompt = `As an expert career coach at EnvisionPaths, analyze the following mock interview for a ${jobTitle} role. 
      ${isFree ? 'Provide a brief, standard summary including a score and 2 key points.' : 'Provide a comprehensive, advanced performance analysis including:'}
      ${!isFree ? `
      1. Overall Performance Score (out of 10)
      2. Key Strengths (3 points)
      3. Areas for Improvement (3 points)
      4. A final encouraging "Roadmap to Success" for this candidate.
      ` : ''}
      
      Format the response clearly with headings.
      
      Interview Transcript:
      ${conversation}`;

      const response = await generateContent(prompt);
      const summaryText = response.text;
      setSummary(summaryText);

      // Extract score (simple regex)
      const scoreMatch = summaryText.match(/Score:?\s*(\d+)/i) || summaryText.match(/(\d+)\/10/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;

      // Save to backend
      await fetch(API_URL + '/api/simulations/complete', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          simulation_id: currentSimulationId,
          job_title: jobTitle,
          industry,
          score,
          feedback: summaryText,
          messages: messages.map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });
      
      setCurrentSimulationId(null);
      trackEvent('simulation_completed', { job_title: jobTitle, score });
      fetchHistory();
    } catch (error) {
      console.error("Error generating summary:", error);
      setSummary("We encountered an error generating your summary. Please try again or review your chat history.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setIsEnhancingResume(true);
    
    // Simulate AI enhancement based on plan
    setTimeout(() => {
      if (selectedPlan === 'pro') {
        setResumeAnalysis("PRO ENHANCEMENT: Your resume has been optimized with industry-specific keywords, quantified achievements, and strategic formatting. We've identified 12 key skills to highlight for this role.");
      } else if (selectedPlan === 'beginner') {
        setResumeAnalysis("BEGINNER ENHANCEMENT: Basic formatting check complete. Keywords identified. Limited optimization applied.");
      } else {
        setResumeAnalysis("FREE TIER: Resume uploaded. Upgrade to Pro for smart enhancement and keyword optimization.");
      }
      setIsEnhancingResume(false);
    }, 2000);
  };

  const startInterview = async () => {
    if (!jobTitle || isTyping) return;
    
    setIsTyping(true);
    try {
      const res = await fetch(API_URL + '/api/simulations/start', { 
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ job_title: jobTitle, industry })
      });
      
      // Handle non-OK responses
      if (!res.ok) {
        let errorMessage = 'Failed to start interview';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await res.text();
            console.error(`Non-JSON error response (${res.status}):`, text);
            errorMessage = `Server Error (${res.status})`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        alert(errorMessage);
        if (res.status === 403) setStep('pricing');
        return;
      }

      const data = await res.json();
      setCurrentSimulationId(data.simulation_id);

      setStep('interview');
      setQuestionsAsked(1); // First question is about to be asked
      setQuestionsAnswered(0);
      setInterviewCompleted(false);
      setInterviewLength(selectedPlan === 'pro' ? 8 : 5); // Pro gets longer interviews
      setSessionsUsed(prev => prev + 1);
      trackEvent('simulation_started', { job_title: jobTitle });
      

      
      const prompt = `You are a professional career coach and expert interviewer at EnvisionPaths. 
      I am applying for the position of ${jobTitle} in the ${industry} industry. 
      Please start the interview by saying exactly: "Welcome, thanks for coming in!" followed by a brief introduction and your first interview question: "Tell me about yourself."
      Keep your tone professional, encouraging, and insightful.`;

      const response = await generateContent(prompt);
      setMessages([{
        role: 'model',
        text: response.text,
        timestamp: new Date()
      }]);
      
      if (interactionMode === 'voice') {
        speak(response.text);
      }
    } catch (error: any) {
      console.error("Error starting interview:", error);
      showNotification(error.message || "Failed to start interview. Please check your connection.", 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const speak = async (text: string, force: boolean = false) => {
    if (!force && interactionMode !== 'voice' && !isAudioEnabled) return;
    
    try {
      const audio = await generateSpeech(text);
      
      if (audio) {
        const audioUrl = `data:audio/mpeg;base64,${audio}`;
        const audioEl = new Audio(audioUrl);
        setIsSpeaking(true);
        audioEl.onended = () => setIsSpeaking(false);
        audioEl.onerror = () => setIsSpeaking(false);
        audioEl.play();
      } else {
        // Fallback to browser TTS if API fails
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('TTS Error:', e);
      // Fallback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      // @ts-ignore
      const recognition = window._recognition;
      if (recognition) recognition.stop();
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-send if it's a clear result
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSendMessage(fakeEvent, transcript);
      }, 500);
    };

    // @ts-ignore
    window._recognition = recognition;
    recognition.start();
  };

  const handleSendMessage = async (e: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const messageText = overrideInput || input;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    // setQuestionsAnswered(prev => prev + 1); // Move to success block
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Ensure history starts with 'user' for better API compatibility
      if (history.length > 0 && history[0].role === 'model') {
        history.unshift({
          role: 'user',
          parts: [{ text: `I am ready for my ${jobTitle} interview. Please begin.` }]
        });
      }

      const isFree = !selectedPlan || selectedPlan === 'free';
      const isPro = selectedPlan === 'pro';
      
      const systemInstruction = `You are an expert career coach. 
      Conduct a realistic interview for a ${jobTitle} role. 
      ${isFree ? 'This is a free trial session, so keep the interview concise (max 5 questions total).' : ''}
      ${isPro ? 'Provide deep behavioral and technical analysis in your feedback. Focus on high-level strategic answers.' : 'Focus on standard interview questions.'}
      After the user answers a question, briefly acknowledge their answer with a "Coach's Tip" (in italics) 
      and then move on to the next insightful interview question. 
      Focus on behavioral, technical, and situational questions.
      
      MANDATORY: At some point during the interview (preferably towards the middle), you MUST ask the candidate: "Describe yourself with one word."
      
      CRITICAL: You have currently asked ${questionsAsked} questions. 
      The target interview length is ${interviewLength} questions.
      If you have reached ${interviewLength} questions, do NOT ask another question. 
      Instead, say: "That concludes our interview session! I've gathered enough information to provide your performance report. Please click the 'End Session' button to see your results."`;

      console.log('[Chat] Sending message to AI...');
      const response = await Promise.race([
        generateContent(messageText, systemInstruction, history),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out after 60 seconds")), 60000))
      ]) as any;

      console.log('[Chat] AI response received.');

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: text,
        timestamp: new Date()
      }]);
      
      setQuestionsAnswered(prev => prev + 1); // Increment only on success
      
      if (questionsAnswered + 1 < interviewLength) {
        setQuestionsAsked(prev => prev + 1);
      } else {
        setInterviewCompleted(true);
      }
      
      if (interactionMode === 'voice') {
        speak(text);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const isQuota = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
      const errorMsg = isQuota 
        ? "AI Quota exceeded. The system is busy. Please wait 60 seconds and try again." 
        : (error.message || "Failed to get response from AI. Please try again.");
      
      showNotification(errorMsg, 'error');
      setShowRetry(true); // Show the reset button
    } finally {
      setIsTyping(false);
    }
  };

  const TEST_EXPIRATION = new Date('2026-03-20T23:59:59Z');
  const isTestUser = (user?.email?.endsWith('@envisionpaths.com') || user?.email === 'harrisonw707@gmail.com') && new Date() < TEST_EXPIRATION;

  // Automatically grant Pro access to testers during the test window
  useEffect(() => {
    if (isTestUser && selectedPlan !== 'pro') {
      setSelectedPlan('pro');
      console.log('[TESTER] Full access granted until:', TEST_EXPIRATION.toLocaleDateString());
    }
  }, [isTestUser, selectedPlan]);

  const TesterGuide = () => (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsTesterGuideOpen(true)}
        className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-red-400/30 group"
      >
        <Shield size={24} />
        <span className="absolute right-full mr-4 px-3 py-1 bg-theme-surface border border-theme rounded-lg text-[10px] font-black uppercase tracking-widest text-theme-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Tester Tools
        </span>
      </motion.button>

      <Modal
        isOpen={isTesterGuideOpen}
        onClose={() => setIsTesterGuideOpen(false)}
        title="Tester's Command Center"
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 bg-red-600/10 border border-red-600/20 rounded-2xl">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Active Session</p>
              <p className="text-sm font-bold text-theme-primary">{user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Access Expires</p>
              <p className="text-sm font-black text-red-500 uppercase italic">
                {Math.ceil((TEST_EXPIRATION.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Core Features</p>
              <ul className="space-y-2">
                {['Practice Simulation', 'Real-time Feedback', 'Resume Enhancement', 'Voice Interaction'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-theme-primary font-bold uppercase tracking-wider">
                    <CheckCircle2 size={14} className="text-red-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Security & Auth</p>
              <ul className="space-y-2">
                {['2FA (TOTP/Email)', 'Password Reset', 'Session Security', 'Admin Dashboard'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-theme-primary font-bold uppercase tracking-wider">
                    <CheckCircle2 size={14} className="text-red-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 bg-theme-surface border border-theme rounded-2xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Debug Tools</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(API_URL + '/api/health');
                    if (res.ok) showNotification('Server is online!', 'success');
                  } catch (e) {
                    showNotification('Server unreachable', 'error');
                  }
                }}
                className="px-4 py-2 bg-theme-main border border-theme rounded-xl text-[10px] font-black uppercase tracking-widest text-theme-primary hover:text-emerald-500 transition-all"
              >
                Ping Server
              </button>

            </div>
          </div>
        </div>
      </Modal>
    </>
  );

  console.log('[DEBUG] App Render - step:', step, 'isSettingsOpen:', isSettingsOpen);

  const dynamicPlaceholder = (() => {
    if (interviewCompleted) return "Interview finished. View your results below.";
    if (isTyping) return "Coach is thinking...";
    if (isSpeaking) return "Coach is speaking...";
    if (interactionMode === 'voice') return "Listening for your voice...";
    return "Type your answer...";
  })();

  return (
    <div className={`min-h-screen bg-theme-main font-sans text-theme-primary selection:bg-red-600 selection:text-white transition-colors duration-300 ${theme === 'light' ? 'theme-light' : ''}`}>

      {isLoading && (
        <div className="fixed inset-0 bg-theme-main/90 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500/10 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-theme-secondary opacity-50 animate-pulse">Preparing your session...</p>
          
          <div className="mt-8 text-[8px] text-theme-secondary opacity-30 font-mono uppercase tracking-widest">
            Session: {localStorage.getItem('session_id') ? 'Active' : 'None'}
          </div>

          <div className="flex flex-col items-center gap-4 mt-12">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setIsLoading(false)}
              className="px-6 py-2 border border-theme rounded-full text-[10px] font-bold uppercase tracking-widest text-theme-secondary hover:text-theme-primary hover:border-theme transition-all"
            >
              Skip Loading
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={async () => {
                try {
                  const res = await fetch(API_URL + '/api/debug/logs');
                  const data = await res.json();
                  console.log('--- SERVER LOGS ---');
                  data.logs.forEach((log: string) => console.log(log));
                  console.log('--- END SERVER LOGS ---');
                  alert('Server logs printed to browser console (F12)');
                } catch (e) {
                  alert('Failed to fetch logs');
                }
              }}
              className="text-[9px] font-bold uppercase tracking-widest text-theme-secondary hover:text-blue-500 transition-all mt-2"
            >
              View Server Logs (Console)
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={async () => {
                try {
                  const res = await fetch(API_URL + '/api/health');
                  const data = await res.json();
                  alert(`Server Status: ${data.status}\nTime: ${data.timestamp}`);
                } catch (e) {
                  alert('Server Unreachable');
                }
              }}
              className="text-[9px] font-bold uppercase tracking-widest text-theme-secondary hover:text-emerald-500 transition-all mt-2"
            >
              Ping Server
            </motion.button>

          </div>
        </div>
      )}

      {/* Header */}
      {step !== 'auth' && (
        <header className="sticky top-0 z-50 bg-theme-main/90 backdrop-blur-xl px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tighter uppercase italic text-theme-primary">
                Envision<span className="text-red-500">Paths</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full mr-2"
                >
                  <RefreshCw size={10} className="text-red-500 animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-500">AI Processing</span>
                </motion.div>
              )}
              {step === 'interview' && (
                <>
                  <div className="hidden md:flex flex-col items-end mr-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1 bg-theme-surface rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-600 transition-all duration-500" 
                          style={{ width: `${(questionsAnswered / interviewLength) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-white">{questionsAnswered}/{interviewLength}</span>
                    </div>
                  </div>
                  <Tooltip content="Report a glitch and refund session (Limit: 3 per day)">
                    <button 
                      onClick={reportGlitch}
                      aria-label="Report glitch"
                      className="text-[10px] font-black uppercase tracking-widest text-theme-secondary hover:text-theme-primary px-3 py-2 rounded-md border border-theme hover:border-theme transition-all"
                    >
                      Report Glitch
                    </button>
                  </Tooltip>
                  <Tooltip content={interviewCompleted ? "Interview finished! Click to see your report." : "End current session and generate report"}>
                    <button 
                      onClick={endInterview}
                      aria-label="End practice session"
                      className={`text-xs font-black uppercase tracking-widest text-white px-4 py-2 rounded-md border transition-all shadow-lg ${
                        interviewCompleted 
                          ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-emerald-900/20 animate-pulse' 
                          : 'bg-red-600 hover:bg-red-700 border-theme shadow-red-900/20'
                      }`}
                    >
                      {interviewCompleted ? 'Finish & Report' : 'End Session'}
                    </button>
                  </Tooltip>
                </>
              )}
              <Tooltip content="Manage your subscription" position="bottom">
                <button 
                  onClick={() => setStep('pricing')}
                  aria-label="Billing and subscription"
                  className="text-theme-secondary hover:text-red-500 transition-colors flex items-center gap-2"
                >
                  <CreditCard size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Billing</span>
                </button>
              </Tooltip>
              {isAdmin && (
                <Tooltip content="Admin Dashboard" position="bottom">
                  <button 
                    onClick={() => setStep('admin')}
                    aria-label="Admin Dashboard"
                    className="text-theme-secondary hover:text-red-500 transition-colors flex items-center gap-2"
                  >
                    <Shield size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Admin</span>
                  </button>
                </Tooltip>
              )}
              <button 
                onClick={() => {
                  console.log('[DEBUG] Opening Account Settings from Header');
                  setIsSettingsOpen(true);
                }}
                aria-label="Settings"
                className="text-theme-secondary hover:text-red-500 transition-colors"
              >
                <Settings size={20} />
              </button>
              <Tooltip content="Sign out of your account" position="bottom">
                <button 
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="text-theme-secondary hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </Tooltip>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <div className="flex justify-end mb-2 gap-4">
          <span className="text-[10px] font-medium text-theme-secondary uppercase tracking-tighter">App Updated: {lastUpdated}</span>
          <span className="text-[10px] font-medium text-theme-secondary uppercase tracking-tighter">Last Checked: {lastChecked}</span>
        </div>
        {isTestUser && step !== 'auth' && <TesterGuide />}
        <AnimatePresence mode="wait">
          {step === 'auth' ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[90vh] flex flex-col items-center justify-center py-12"
            >
              <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 text-center lg:text-left">
                  <div className="inline-block px-4 py-1.5 bg-red-600/10 border border-red-600/20 rounded-full">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Strategic Interview Coaching</p>
                  </div>
                  <h1 className="text-6xl sm:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-theme-primary">
                    Navigate Your Path <br />
                    <span className="text-red-500">Towards Success</span>
                  </h1>
                  <p className="text-theme-secondary text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                    Strategic interview preparation for modern professionals. Practice with industry-specific scenarios and get real-time feedback to land your dream job.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Real-time Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Industry Specific</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary">Expert Coaching</span>
                    </div>
                  </div>
                </div>

                <div className="bg-theme-surface border border-theme p-10 rounded-3xl backdrop-blur-xl shadow-2xl relative">
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -z-10" />
                  <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -z-10" />
                  
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2 text-theme-primary">
                      {requires2FA ? 'Verification Required' : authMode === 'login' ? 'Welcome Back' : 'Join EnvisionPaths'}
                      <span className="text-[8px] opacity-20 ml-2">v1.2</span>
                    </h2>
                    <p className="text-theme-secondary text-sm">
                      {requires2FA 
                        ? 'Enter your two-factor authentication code.'
                        : authMode === 'login' 
                        ? 'Enter your credentials to access the platform.' 
                        : 'Create your account to start your journey.'}
                    </p>
                  </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest text-center"
                  >
                    {authError}
                  </motion.div>
                )}

                {/* Admin Bypass - Hidden unless admin email is entered */}
                {email === 'harrisonw707@gmail.com' && (
                  <div className="mb-8">
                    {loginError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                        {loginError}
                      </div>
                    )}
                    <button 
                      onClick={async () => {
                        console.log('[AUTH] Admin bypass clicked');
                        setLoginError(null);
                        setIsLoading(true);
                        try {
                          const response = await fetch(API_URL + '/api/admin-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: 'harrisonw707@gmail.com' })
                          });
                          const data = await response.json();
                          if (data.success) {
                            console.log('[AUTH] Admin login success, sessionId:', data.sessionId);
                            if (data.sessionId) {
                              localStorage.setItem('session_id', data.sessionId);
                            }
                            if (data.user) {
                              setIsAdmin(!!data.user.is_admin);
                              setSelectedPlan(data.user.plan_type);
                            }
                            setStep('admin');
                          } else {
                            console.error('[AUTH] Admin login failed:', data.error);
                            setLoginError(data.error || 'Access denied.');
                          }
                        } catch (err) {
                          console.error('[AUTH] Admin login server error:', err);
                          setLoginError('Server error.');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="w-full p-5 bg-theme-surface hover:bg-theme-surface-hover text-theme-secondary font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 border border-theme group cursor-pointer"
                    >
                      System Access
                      <Shield size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center mt-3 font-bold">
                      Restricted Access Only
                    </p>
                  </div>
                )}


                {showForgotPasswordForm ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-black uppercase tracking-tight italic text-theme-primary">
                        {resetStep === 'email' ? 'Reset Password' : resetStep === 'code' ? 'Verify Code' : 'New Password'}
                      </h3>
                      <p className="text-xs text-theme-secondary mt-2">
                        {resetStep === 'email' ? 'Enter your email to receive a reset code.' : resetStep === 'code' ? 'Enter the 6-digit code sent to your email.' : 'Enter your new secure password.'}
                      </p>
                    </div>

                    {resetStep === 'email' && (
                      <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your Email</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              type="email" 
                              required
                              placeholder="Enter your email address"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-xl transition-all shadow-lg shadow-red-900/20"
                        >
                          Send Reset Code
                        </button>
                      </form>
                    )}

                    {resetStep === 'code' && (
                      <form onSubmit={handleVerifyResetCode} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Verification Code</label>
                          <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              type="text" 
                              required
                              placeholder="000000"
                              maxLength={6}
                              value={resetCode}
                              onChange={(e) => setResetCode(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm tracking-[0.5em] font-mono text-center text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-xl transition-all shadow-lg shadow-red-900/20"
                        >
                          Verify Code
                        </button>
                      </form>
                    )}

                    {resetStep === 'password' && (
                      <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              type="password" 
                              required
                              placeholder="Enter your new secure password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest py-5 rounded-xl transition-all shadow-lg shadow-red-900/20"
                        >
                          Update Password
                        </button>
                      </form>
                    )}

                    <button 
                      type="button"
                      onClick={() => {
                        setShowForgotPasswordForm(false);
                        setResetStep('email');
                        setAuthError(null);
                      }}
                      className="w-full text-xs text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : requires2FA ? (
                  <div className="space-y-6">
                    <div className="flex gap-2 p-1 bg-theme-surface rounded-xl border border-theme">
                      <button 
                        onClick={() => { setTwoFactorMethod('totp'); setTwoFactorCode(''); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${twoFactorMethod === 'totp' ? 'bg-red-600 text-white' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        App Code
                      </button>
                      <button 
                        onClick={() => { setTwoFactorMethod('email'); setTwoFactorCode(''); }}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${twoFactorMethod === 'email' ? 'bg-red-600 text-white' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Email Code
                      </button>
                    </div>

                    {twoFactorMethod === 'email' && !emailCodeSent ? (
                      <div className="text-center space-y-4 py-4">
                        <p className="text-xs text-theme-secondary">We can send a one-time verification code to your registered email address.</p>
                        <button 
                          onClick={sendEmailCode}
                          disabled={isSendingCode}
                          className="w-full bg-theme-primary text-theme-bg font-black uppercase tracking-widest py-4 rounded-xl hover:opacity-90 transition-colors text-xs disabled:opacity-50"
                        >
                          {isSendingCode ? 'Sending...' : 'Send Email Code'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handle2FALogin} className="space-y-5">
                        <div className="space-y-2">
                          <label htmlFor="2fa-code" className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">
                            {twoFactorMethod === 'totp' ? 'Authenticator App Code' : 'Your Verification Code'}
                          </label>
                          <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              id="2fa-code"
                              type="text" 
                              required
                              placeholder="000000"
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm tracking-[0.5em] font-mono text-center text-theme-primary"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 border border-theme group"
                        >
                          Verify & Login
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </form>
                    )}

                    <button 
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        setTempUserId(null);
                        setTwoFactorCode('');
                        setTwoFactorMethod('totp');
                        setEmailCodeSent(false);
                      }}
                      className="w-full text-xs text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <React.Fragment>
                    <form onSubmit={handleAuth} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your Email</label>
                        <Tooltip content={authMode === 'login' ? "Enter your registered email" : "Enter your professional email"} position="right">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              id="email"
                              name="email"
                              type="email" 
                              required
                              placeholder="Enter your email address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </Tooltip>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-theme-secondary ml-1">Your Password</label>
                        <Tooltip content="Minimum 8 characters" position="right">
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary" size={18} />
                            <input 
                              id="password"
                              name="password"
                              type="password" 
                              required
                              placeholder="Enter your secure password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full pl-12 pr-4 py-5 bg-theme-input border border-theme rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-sm text-theme-primary"
                            />
                          </div>
                        </Tooltip>
                      </div>

                      <Tooltip content={authMode === 'login' ? "Securely access your dashboard" : "Join the Envision community"}>
                        <button 
                          type="submit"
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-5 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 border border-theme group"
                        >
                          {authMode === 'login' ? 'Sign In' : 'Join EnvisionPaths'}
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </Tooltip>

                      {authMode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => {
                            setShowForgotPasswordForm(true);
                            setResetStep('email');
                            setAuthError(null);
                          }}
                          className="w-full text-[10px] text-theme-secondary hover:text-red-500 transition-colors uppercase tracking-widest font-bold mt-2"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </form>

                    <div className="mt-8 text-center space-y-4">
                      <button 
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="text-xs text-theme-secondary hover:text-red-500 transition-colors block w-full"
                      >
                        {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                      </button>

                      {/* Tester Access Panel */}
                      <div className="mt-10 pt-8 border-t border-theme space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={14} className="text-red-500" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary">Tester's Quick Access</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={() => {
                              setEmail('standard-test@envisionpaths.com');
                              setPassword('Password123!');
                              setAuthMode('login');
                            }}
                            className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left group"
                          >
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary group-hover:text-theme-primary">Standard Test Account</p>
                              <p className="text-[8px] text-theme-secondary font-bold uppercase tracking-widest mt-0.5">Pro Plan • Pre-configured</p>
                            </div>
                            <Zap size={14} className="text-theme-secondary group-hover:text-red-500 transition-colors" />
                          </button>
                          <button 
                            onClick={() => {
                              setEmail('premium-test@envisionpaths.com');
                              setPassword('VertexPassword123!');
                              setAuthMode('login');
                            }}
                            className="flex items-center justify-between p-4 bg-theme-surface border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left group"
                          >
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary group-hover:text-theme-primary">Premium AI Specialist</p>
                              <p className="text-[8px] text-theme-secondary font-bold uppercase tracking-widest mt-0.5">Elite Plan • Advanced Focus</p>
                            </div>
                            <Zap size={14} className="text-theme-secondary group-hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                        <p className="text-[8px] text-theme-secondary text-center uppercase font-bold tracking-widest">
                          Click an account above to auto-fill credentials
                        </p>
                      </div>

                      <div className="flex justify-center gap-4">
                        <button 
                          type="button"
                          onClick={() => setIsPrivacyOpen(true)}
                          className="text-[10px] text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                        >
                          Privacy Policy
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsTermsOpen(true)}
                          className="text-[10px] text-theme-secondary hover:text-theme-primary transition-colors uppercase tracking-widest font-bold"
                        >
                          Terms of Service
                        </button>
                      </div>
                      {authMode === 'signup' && (
                        <div className="flex flex-col items-center gap-1 mt-2">
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-red-500" />
                            No spam email. Ever.
                          </p>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-red-500" />
                            Cancel subscription anytime.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-theme">
                      <p className="text-[10px] text-theme-secondary uppercase tracking-[0.2em] font-black mb-6 text-center">Quick Start Guide</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-[10px] font-black text-red-500 mx-auto">1</div>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center leading-tight">Click Sign Up Below</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-[10px] font-black text-red-500 mx-auto">2</div>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center leading-tight">Create Account</p>
                        </div>
                        <div className="space-y-2">
                          <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-[10px] font-black text-red-500 mx-auto">3</div>
                          <p className="text-[9px] text-theme-secondary uppercase tracking-widest text-center leading-tight">Access Dashboard</p>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )}
</div>
            </div>


            </motion.div>
          ) : step === 'pricing' ? (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto mt-8 md:mt-12 px-4 md:px-0"
            >
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-4">
                  {sessionsUsed >= 2 && (!selectedPlan || selectedPlan === 'free') ? 'Ready for more practice?' : 'Level Up Your Career'}
                </h2>
                <p className="text-theme-secondary max-w-2xl mx-auto">
                  {sessionsUsed >= 2 && (!selectedPlan || selectedPlan === 'free') 
                    ? "You’ve mastered your free simulations for now! Ready for more practice? Upgrade to keep the momentum going." 
                    : 'You’re making progress. Choose the plan that fits your current career goals.'}
                </p>
                <div className="mt-4 inline-block px-4 py-1 bg-theme-surface-hover border border-theme rounded-full">
                  <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-[0.2em]">
                    {sessionsUsed >= 2 && (!selectedPlan || selectedPlan === 'free') ? 'Free Limit Reached' : 'Build discipline. Navigate your path towards success.'}
                  </p>
                </div>

                <div className="mt-10 flex items-center justify-center gap-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!isAnnual ? 'text-theme-primary' : 'text-theme-secondary'}`}>Monthly</span>
                  <button 
                    onClick={() => setIsAnnual(!isAnnual)}
                    className="w-14 h-7 bg-theme-surface rounded-full p-1 relative transition-colors hover:bg-theme-surface-hover border border-theme"
                  >
                    <motion.div 
                      animate={{ x: isAnnual ? 28 : 0 }}
                      className="w-5 h-5 bg-red-600 rounded-full shadow-lg"
                    />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isAnnual ? 'text-theme-primary' : 'text-theme-secondary'}`}>Annual</span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Save 20%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Free Tier */}
                <div className="bg-theme-surface border border-theme p-8 rounded-3xl backdrop-blur-sm flex flex-col hover:border-red-500/30 transition-all group">
                  <div className="mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-theme-secondary">Free</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-primary">$0</span>
                    </div>
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Test the system</p>
                  </div>
                  
                  <ul className="space-y-3 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      2 simulations / month
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Standard feedback
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Standard question bank
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Limited resources
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Limited Resume Upload
                    </li>
                  </ul>

                  <button 
                    onClick={() => {
                      setSelectedPlan('free');
                      trackEvent('upgrade_clicked', { plan: 'free' });
                      setStep('setup');
                    }}
                    disabled={sessionsUsed >= 2}
                    className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                      selectedPlan === 'free' || !selectedPlan
                        ? 'bg-theme-surface-hover text-theme-primary border-theme' 
                        : 'bg-transparent text-theme-secondary border-theme hover:border-red-500/50 hover:text-theme-primary'
                    } ${sessionsUsed >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {selectedPlan === 'free' || !selectedPlan ? 'Current Plan' : 'Select Free'}
                  </button>
                </div>

                {/* Beginner Tier */}
                <div className="bg-theme-surface border border-theme p-8 rounded-3xl backdrop-blur-sm flex flex-col hover:border-blue-500/50 transition-all group relative">
                  <div className="absolute -top-3 left-6 bg-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                    30-Day Unlock
                  </div>
                  <div className="mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-blue-400">Beginner</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-primary">$5</span>
                    </div>
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Short-term burst</p>
                  </div>
                  
                  <ul className="space-y-3 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      Unlimited for 30 days
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      Full performance feedback
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      Expanded question bank
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      Performance tracking
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-blue-500" />
                      Basic Resume Upload
                    </li>
                  </ul>

                  <button 
                    onClick={() => {
                      trackEvent('upgrade_clicked', { plan: 'beginner' });
                      selectPlan('beginner');
                    }}
                    className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                      selectedPlan === 'beginner' 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-theme-surface-hover text-theme-primary border-theme hover:border-blue-500/50'
                    }`}
                  >
                    {selectedPlan === 'beginner' ? 'Active' : 'Get Access'}
                  </button>
                </div>

                {/* Pro Tier */}
                <div className="bg-theme-surface border border-red-600/30 p-8 rounded-3xl backdrop-blur-sm flex flex-col hover:border-red-600/60 transition-all group relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-white">
                    Most Popular
                  </div>
                  <div className="mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-red-500">Pro</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-primary">${isAnnual ? '12' : '15'}</span>
                      <span className="text-theme-secondary text-[10px] uppercase font-bold tracking-widest">/ month</span>
                    </div>
                    {isAnnual && (
                      <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest mt-1">Billed annually ($144)</p>
                    )}
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Power users</p>
                  </div>
                  
                  <ul className="space-y-3 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Everything in Beginner
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Advanced performance critique
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Behavioral + Technical focus
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Unlimited saved history
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Priority processing
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Voice Interaction Mode
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-red-600" />
                      Smart Resume Optimization
                    </li>
                  </ul>

                  <button 
                    onClick={() => {
                      trackEvent('upgrade_clicked', { plan: 'pro' });
                      selectPlan('pro');
                    }}
                    className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border transition-all ${
                      selectedPlan === 'pro' 
                        ? 'bg-red-600 text-white border-red-500' 
                        : 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                    }`}
                  >
                    {selectedPlan === 'pro' ? 'Active' : 'Go Pro'}
                  </button>
                </div>

                {/* Elite Tier */}
                <div className={`bg-theme-surface border border-theme p-8 rounded-3xl backdrop-blur-sm flex flex-col group transition-all opacity-70 grayscale relative overflow-hidden`}>
                  <div className="absolute top-4 right-4 bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                    Coming Soon
                  </div>
                  <div className="mb-8">
                    <h3 className="text-xl font-black uppercase italic mb-2 text-theme-secondary">Elite</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-theme-secondary">$49</span>
                      <span className="text-theme-secondary text-[10px] uppercase font-bold tracking-widest">/ month</span>
                    </div>
                    <p className="text-[10px] text-theme-secondary uppercase font-bold mt-1">Future Premium Features</p>
                  </div>
                  
                  <ul className="space-y-3 mb-10 flex-1">
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Everything in Pro
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Unlimited Simulations
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      1-on-1 Human Coaching
                    </li>
                    <li className="flex items-center gap-3 text-theme-secondary text-xs">
                      <CheckCircle2 size={14} className="text-theme-secondary" />
                      Advanced Career Roadmap
                    </li>
                  </ul>

                  <button 
                    disabled
                    className="w-full py-3 text-xs font-black uppercase tracking-widest rounded-xl border bg-theme-surface-hover text-theme-secondary border-theme cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-2 text-theme-secondary text-sm italic">
                  <Award size={16} />
                  <span>Ready for more practice? Continue sharpening your skills.</span>
                </div>
              </div>
            </motion.div>
          ) : step === 'setup' ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto mt-8 md:mt-12 px-4 md:px-0"
            >
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic mb-4 text-theme-primary">Prepare for Success</h2>
                <p className="text-theme-secondary max-w-2xl mx-auto">The interview is your opportunity to shine. Select your industry and target role to begin your practice session.</p>
                {(!selectedPlan || selectedPlan === 'free') && (
                  <div className="mt-6 inline-block bg-theme-surface border border-theme px-4 py-2 rounded-full">
                    <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest">
                      {sessionsUsed} of 2 free simulations used
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Industry & Role */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-theme-surface border border-theme rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        1. Industry Focus
                      </label>
                      <div className="relative group">
                        <select 
                          id="industrySelect"
                          value={industry}
                          onChange={(e) => {
                            setIndustry(e.target.value);
                            setJobTitle('');
                          }}
                          className="w-full bg-theme-input border border-theme rounded-2xl px-6 py-6 outline-none focus:border-red-500 transition-all appearance-none text-sm font-bold uppercase tracking-widest cursor-pointer hover:border-red-500/50"
                        >
                          <option value="" disabled className="bg-theme-surface">Select Industry...</option>
                          {Object.keys(suggestedRoles).map((ind) => (
                            <option key={ind} value={ind} className="bg-theme-surface">{ind.replace(/([A-Z])/g, ' $1').trim()}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-theme-secondary pointer-events-none group-hover:text-theme-primary transition-colors" size={18} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        2. Target Role
                      </label>
                      <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-theme-secondary" size={20} />
                        <input 
                          id="jobTitle"
                          name="jobTitle"
                          type="text" 
                          placeholder="Search or enter any job title..."
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="w-full pl-16 pr-6 py-6 bg-theme-input border border-theme rounded-2xl focus:border-red-600 outline-none transition-all text-lg font-bold placeholder:text-theme-secondary/50 text-theme-primary"
                        />
                      </div>

                      {industry && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[8px] font-black text-theme-secondary uppercase tracking-widest">Suggested Roles</p>
                            <p className="text-[8px] font-black text-theme-secondary uppercase tracking-widest flex items-center gap-1 animate-pulse">
                              <ChevronDown size={10} />
                              Scroll for more
                            </p>
                          </div>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"
                          >
                            {suggestedRoles[industry].map((role) => (
                              <button
                                key={role}
                                onClick={() => setJobTitle(role)}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-center ${
                                  jobTitle === role 
                                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' 
                                    : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50 hover:text-theme-primary'
                                }`}
                              >
                                {role}
                              </button>
                            ))}
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Simulation History */}
                  {history.length > 0 && (
                    <div className="bg-theme-surface border border-theme rounded-3xl p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-2">
                          <History size={16} className="text-red-500" />
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Progress & History</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-theme-secondary">Score Trend</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Trend Chart */}
                      <div className="h-[200px] w-full mb-8 bg-theme-input border border-theme rounded-2xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...history].reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                            <XAxis 
                              dataKey="created_at" 
                              hide 
                            />
                            <YAxis 
                              domain={[0, 10]} 
                              stroke={theme === 'dark' ? '#666' : '#999'} 
                              fontSize={8}
                              tickLine={false}
                              axisLine={false}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                fontSize: '10px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#dc2626" 
                              strokeWidth={3} 
                              dot={{ fill: '#dc2626', r: 4 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {history.slice(0, 4).map((sim) => (
                          <button 
                            key={sim.id} 
                            onClick={() => {
                              setSelectedSimulation(sim);
                              fetchSimulationMessages(sim.id);
                            }}
                            className="w-full text-left flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/50 hover:bg-theme-surface-hover transition-all group"
                          >
                            <div>
                              <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest group-hover:text-red-500 transition-colors">{sim.job_title}</p>
                              <p className="text-[8px] text-theme-secondary uppercase font-black tracking-widest mt-1">{new Date(sim.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-black italic text-red-500">{sim.score}/10</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice Schedule & Reminders */}
                  <div className="bg-theme-surface border border-theme rounded-3xl p-4 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-red-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Practice Schedule</h3>
                      </div>
                      <button 
                        onClick={() => setIsScheduling(true)}
                        className="text-[8px] font-black uppercase tracking-widest bg-red-600/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                      >
                        Add Session
                      </button>
                    </div>

                    {reminders.length > 0 ? (
                      <div className="space-y-3">
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className={`flex items-center justify-between p-4 bg-theme-input border rounded-2xl transition-all ${reminder.completed ? 'border-emerald-500/20 opacity-50' : 'border-theme hover:border-red-500/30'}`}>
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => toggleReminder(reminder.id, reminder.completed)}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${reminder.completed ? 'bg-emerald-500 border-emerald-500' : 'border-theme hover:border-red-500'}`}
                              >
                                {reminder.completed && <CheckCircle2 size={12} className="text-white" />}
                              </button>
                              <div className="min-w-0">
                                <p className={`text-xs font-black uppercase tracking-wider truncate ${reminder.completed ? 'line-through text-theme-secondary' : 'text-theme-primary'}`}>{reminder.title}</p>
                                <p className="text-[10px] text-theme-secondary uppercase font-black tracking-wider mt-1 truncate">
                                  {new Date(reminder.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => deleteReminder(reminder.id)}
                              className="text-theme-secondary hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-theme rounded-2xl">
                        <p className="text-xs text-theme-secondary font-bold uppercase tracking-wider">No practice sessions scheduled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Resume & Start */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-theme-surface border border-theme rounded-3xl p-8 space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        3. Interaction Mode
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          id="interactionModeText"
                          onClick={() => setInteractionMode('text')}
                          className={`flex items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                            interactionMode === 'text'
                              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20'
                              : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50'
                          }`}
                        >
                          <Keyboard size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Type (Text)</span>
                        </button>
                        <button
                          id="interactionModeVoice"
                          onClick={() => {
                            if (selectedPlan === 'pro' || selectedPlan === 'elite' || isAdmin) {
                              setInteractionMode('voice');
                            } else {
                              trackEvent('upgrade_prompt', { feature: 'voice' });
                              alert('Voice Interaction is a Pro feature. Please upgrade to access.');
                            }
                          }}
                          className={`flex items-center justify-center gap-3 p-6 rounded-2xl border transition-all relative ${
                            interactionMode === 'voice'
                              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20'
                              : 'bg-theme-input border-theme text-theme-secondary hover:border-red-500/50'
                          }`}
                        >
                          <Mic size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Talk (Voice)</span>
                          {!(selectedPlan === 'pro' || selectedPlan === 'elite' || isAdmin) && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest text-white border border-black shadow-lg">Pro</div>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        4. Resume Upload
                      </label>
                      
                      <div className="relative">
                        <input 
                          type="file" 
                          id="resume-upload"
                          className="hidden" 
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleResumeUpload}
                        />
                        <label 
                          htmlFor="resume-upload"
                          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                            resumeFile 
                              ? 'border-emerald-500/50 bg-emerald-500/5' 
                              : 'border-theme bg-theme-surface hover:border-red-500/50 hover:bg-theme-surface-hover'
                          }`}
                        >
                          {isEnhancingResume ? (
                            <div className="flex flex-col items-center gap-3">
                              <RefreshCw className="animate-spin text-red-500" size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Optimizing your resume...</p>
                            </div>
                          ) : resumeFile ? (
                            <div className="flex flex-col items-center gap-3">
                              <FileText className="text-emerald-500" size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{resumeFile.name}</p>
                              <p className="text-[8px] text-theme-secondary uppercase font-bold">Click to replace</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <Upload className="text-theme-secondary opacity-50 group-hover:text-red-500" size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Upload Resume</p>
                              <p className="text-[8px] text-theme-secondary opacity-50 uppercase font-bold text-center">PDF, DOCX, TXT (MAX 5MB)</p>
                            </div>
                          )}
                        </label>
                      </div>

                      {resumeAnalysis && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-4 rounded-xl border text-[10px] font-bold leading-relaxed ${
                            selectedPlan === 'pro' 
                              ? 'bg-red-600/10 border-red-600/20 text-red-400' 
                              : selectedPlan === 'beginner'
                              ? 'bg-blue-600/10 border-blue-600/20 text-blue-400'
                              : 'bg-theme-surface border-theme text-theme-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Zap size={12} className={selectedPlan === 'pro' ? 'text-red-500' : 'text-blue-500'} />
                            <span className="uppercase tracking-widest">Smart Optimization Report</span>
                          </div>
                          {resumeAnalysis}
                        </motion.div>
                      )}

                      {(!selectedPlan || selectedPlan === 'free') && (
                        <div className="p-4 bg-theme-surface border border-theme rounded-xl">
                          <p className="text-[9px] text-theme-secondary font-bold uppercase tracking-widest leading-normal">
                            Upgrade to <span className="text-red-500">Pro</span> for deep resume analysis and keyword optimization for your target role.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Tooltip content="Launch the career coach simulation">
                      <button 
                        onClick={startInterview}
                        disabled={!jobTitle}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.3em] py-8 rounded-3xl shadow-2xl shadow-red-900/40 transition-all flex flex-col items-center justify-center gap-2 border border-red-500/20 group"
                      >
                        <span className="text-xl">Start Practice Session</span>
                        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] tracking-widest">Prepare for {jobTitle || 'Role'}</span>
                          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="mt-16 grid grid-cols-4 gap-6">
                <div className="p-8 bg-theme-surface border border-theme rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <Award className="mx-auto text-red-500 mb-4" size={32} />
                  <p className="text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Expert Tips</p>
                </div>
                <div className="p-8 bg-theme-surface border border-theme rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <CheckCircle2 className="mx-auto text-red-500 mb-4" size={32} />
                  <p className="text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Skill Validation</p>
                </div>
                <div className="p-8 bg-theme-surface border border-theme rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <Target className="mx-auto text-red-500 mb-4" size={32} />
                  <p className="text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Goal Focused</p>
                </div>
                <div className="p-8 bg-theme-surface border border-theme rounded-3xl text-center group hover:border-red-500 transition-colors">
                  <RefreshCw className="mx-auto text-red-500 mb-4" size={32} />
                  <p className="text-[10px] font-black uppercase text-theme-secondary tracking-widest group-hover:text-theme-primary transition-colors">Infinite Retries</p>
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
              {/* Interview Header */}
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/20 border border-red-500/20">
                    <Briefcase size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-theme-primary leading-none">{jobTitle}</h2>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mt-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      Live Practice Session
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tooltip content="End current session and generate your performance report">
                    <button 
                      onClick={endInterview}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-red-900/40 transition-all flex items-center gap-2 border border-red-500/20 group"
                    >
                      <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                      End Session
                    </button>
                  </Tooltip>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col gap-8">
                {/* Chat Interface */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-8 pb-8 px-2 scrollbar-hide">
                    {(!selectedPlan || selectedPlan === 'free') && (
                      <div className="flex justify-center mb-4">
                        <div className="bg-red-600/10 border border-red-600/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Trial Session Active</p>
                        </div>
                      </div>
                    )}
                    


                    {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                        msg.role === 'user' ? 'bg-red-600 border-red-500/20' : 'bg-theme-surface border-theme'
                      }`}>
                        {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-red-500" />}
                      </div>
                      <div className={`relative group p-4 md:p-6 rounded-2xl shadow-xl transition-all ${
                        msg.role === 'user' 
                          ? 'bg-red-600/5 border border-red-600/20 text-theme-primary rounded-tr-none' 
                          : 'bg-theme-surface border border-theme text-theme-primary rounded-tl-none'
                      }`}>
                        <div className={`markdown-body text-sm md:text-base leading-relaxed font-medium ${theme === 'dark' ? 'prose-invert' : ''}`}>
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                        
                        <div className={`flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <button 
                            onClick={() => copyToClipboard(msg.text)}
                            className="p-1.5 hover:bg-theme-surface-hover rounded-md text-theme-secondary transition-colors"
                            title="Copy message"
                          >
                            <Copy size={12} />
                          </button>
                          {msg.role === 'model' && (
                            <button 
                              onClick={() => speak(msg.text, true)}
                              className="p-1.5 hover:bg-theme-surface-hover rounded-md text-theme-secondary transition-colors"
                              title="Read aloud"
                            >
                              <Volume2 size={12} />
                            </button>
                          )}
                          <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-end gap-3">
                      <div className="w-8 h-8 rounded-xl bg-theme-surface border border-theme flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot size={14} className="text-red-500" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-theme-surface border border-theme text-theme-primary rounded-bl-none shadow-md flex items-center gap-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                opacity: [0.4, 1, 0.4],
                                y: [0, -2, 0]
                              }}
                              transition={{ 
                                duration: 1.4, 
                                repeat: Infinity, 
                                delay: i * 0.2,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 h-1.5 bg-red-500 rounded-full"
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-theme-secondary opacity-40 italic">
                          Coach is thinking...
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="mt-auto pt-6 border-t border-theme">
                    <div className="mb-4 px-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-secondary">Interview Progress</span>
                        <span className="text-[10px] font-black text-theme-primary">{questionsAnswered} / {interviewLength} Questions</span>
                      </div>
                      <div className="w-full h-1 bg-theme-surface rounded-full overflow-hidden border border-theme">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(questionsAnswered / interviewLength) * 100}%` }}
                          className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                        />
                      </div>
                    </div>
                    <form onSubmit={(e) => handleSendMessage(e)} className="relative flex gap-4 items-end">
                      <Tooltip content={`Switch to ${interactionMode === 'text' ? 'Voice' : 'Text'} Input`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (interactionMode === 'text') {
                              if (selectedPlan === 'pro' || selectedPlan === 'elite' || isAdmin) {
                                setInteractionMode('voice');
                                showNotification('Voice mode enabled. Click the mic to start talking.', 'info');
                              } else {
                                showNotification('Voice Interaction is a Pro feature.', 'info');
                              }
                            } else {
                              setInteractionMode('text');
                              showNotification('Text mode enabled.', 'info');
                            }
                          }}
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all border-2 flex-shrink-0 ${
                            interactionMode === 'voice' 
                              ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20' 
                              : 'bg-theme-surface border-theme text-theme-secondary hover:border-red-500/50 hover:text-red-500'
                          }`}
                        >
                          {interactionMode === 'text' ? <Mic size={24} /> : <Keyboard size={24} />}
                        </button>
                      </Tooltip>

                      <div className="relative flex-1">
                        <label htmlFor="chatInput" className="sr-only">Your response</label>
                        <textarea 
                          id="chatInput"
                          name="chatInput"
                          autoComplete="off"
                          autoFocus
                          rows={3}
                          placeholder={dynamicPlaceholder}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (input.trim() && !isTyping) {
                                handleSendMessage({ preventDefault: () => {} } as React.FormEvent);
                              }
                            }
                          }}
                          aria-multiline={true}
                          className="w-full pl-8 pr-20 py-4 bg-theme-surface border border-theme rounded-2xl shadow-2xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-xl text-theme-primary resize-none overflow-y-auto"
                        />
                        {showRetry && (
                          <button 
                            type="button"
                            onClick={() => {
                              setIsTyping(false);
                              setShowRetry(false);
                              showNotification("AI is taking longer than usual. You can try sending your message again.", 'info');
                            }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-theme-surface border border-theme rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 shadow-xl flex items-center gap-2 hover:bg-theme-surface-hover transition-all"
                          >
                            <RefreshCw size={12} className="animate-spin" />
                            Stuck? Reset Typing
                          </button>
                        )}
                        <Tooltip content={isTyping ? "Coach is thinking..." : "Send your response to the coach"}>
                          <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            aria-label="Send message"
                            className="absolute right-3 bottom-3 w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 disabled:opacity-30 transition-all shadow-lg shadow-red-900/20 border border-red-500/20"
                          >
                            {isTyping ? <RefreshCw size={22} className="animate-spin" /> : <Send size={22} />}
                          </button>
                        </Tooltip>
                      </div>
                      
                      {interactionMode === 'voice' && (
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all border-2 ${
                            isListening 
                              ? 'bg-red-600 border-red-400 animate-pulse shadow-lg shadow-red-900/40' 
                              : 'bg-theme-surface border-theme hover:border-red-500/50'
                          }`}
                        >
                          <Mic size={32} className={isListening ? 'text-white' : 'text-theme-secondary'} />
                        </button>
                      )}
                    </form>
                    <div className="flex justify-between items-center mt-6 px-2">
                      <div className="flex items-center gap-4">
                        <p className="text-[9px] text-theme-secondary opacity-50 uppercase tracking-[0.3em] font-black">
                          Career Intelligence
                        </p>
                        <button 
                          onClick={exportTranscript}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-theme-secondary hover:text-theme-primary transition-colors group"
                        >
                          <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
                          Export Transcript
                        </button>
                        <div className="w-px h-3 bg-theme-secondary opacity-20" />
                        <button 
                          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                          className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors group ${isAudioEnabled ? 'text-red-500' : 'text-theme-secondary hover:text-theme-primary'}`}
                        >
                          {isAudioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                          Audio Feedback: {isAudioEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : step === 'admin' ? (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto mt-12 px-4 pb-20"
            >
              <div className="bg-theme-surface border border-theme p-6 md:p-10 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-2 text-theme-primary">Admin Console</h2>
                    <p className="text-theme-secondary text-sm uppercase tracking-widest font-bold">Security & System Management</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex bg-theme-input p-1 rounded-xl border border-theme">
                      <button 
                        onClick={() => setAdminTab('overview')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'overview' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Overview
                      </button>
                      <button 
                        onClick={() => setAdminTab('stats')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'stats' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Statistics
                      </button>
                      <button 
                        onClick={() => setAdminTab('debug')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'debug' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-theme-secondary hover:text-theme-primary'}`}
                      >
                        Debug
                      </button>
                    </div>
                    <button 
                      onClick={() => setStep('setup')}
                      className="px-6 py-3 bg-theme-input border border-theme text-theme-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-theme-surface-hover transition-all"
                    >
                      Exit
                    </button>
                  </div>
                </div>

                {adminTab === 'overview' ? (
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      {/* Stats Overview */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="text-red-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Total Users</span>
                          </div>
                          <p className="text-3xl font-black text-theme-primary">{adminUsers.length}</p>
                        </div>
                        <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="text-red-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Simulations</span>
                          </div>
                          <p className="text-3xl font-black text-theme-primary">{simulations.length}</p>
                        </div>
                        <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <Activity className="text-red-500" size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Activity Logs</span>
                          </div>
                          <p className="text-3xl font-black text-theme-primary">{activityLogs.length}</p>
                        </div>
                      </div>

                      {/* Activity Logs Table */}
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black uppercase italic flex items-center gap-2 text-theme-primary">
                            <History className="text-red-500" size={20} />
                            Recent Activity
                          </h3>
                          <button 
                            onClick={exportActivityLogs}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                          >
                            <Download size={14} />
                            Export CSV
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-theme">
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">User</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Action</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Country</th>
                                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-theme-secondary">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme">
                              {activityLogs.slice(0, 10).map((log, idx) => (
                                <tr key={idx} className="group hover:bg-theme-surface-hover transition-colors">
                                  <td className="py-4">
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-theme-primary">{log.email}</span>
                                      <span className="text-[9px] text-theme-secondary font-mono opacity-50">{log.ip_address || '0.0.0.0'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4">
                                    <span className="px-2 py-1 bg-red-600/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded border border-red-500/20">
                                      {log.activity.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="py-4">
                                    <div className="flex items-center gap-2">
                                      <Globe size={12} className="text-theme-secondary" />
                                      <span className="text-xs text-theme-primary">{log.country || 'Unknown'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-xs text-theme-secondary">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                      {/* System Tools */}
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-6 flex items-center gap-2 text-theme-primary">
                          <Settings className="text-red-500" size={20} />
                          System Tools
                        </h3>
                        <div className="space-y-3">
                          <button 
                            onClick={syncPlayConsoleData}
                            disabled={isImporting}
                            className="w-full p-4 bg-theme-surface-hover border border-theme rounded-xl hover:border-red-500 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <RefreshCw size={18} className={`text-theme-secondary group-hover:text-red-500 ${isImporting ? 'animate-spin' : ''}`} />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">Sync Play Console</p>
                                <p className="text-[9px] text-theme-secondary uppercase tracking-tighter">Import historical data</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-theme-secondary" />
                          </button>

                          <button 
                            onClick={exportAllData}
                            disabled={isExporting}
                            className="w-full p-4 bg-theme-surface-hover border border-theme rounded-xl hover:border-red-500 transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <Download size={18} className="text-theme-secondary group-hover:text-red-500" />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-theme-primary">Export All Data</p>
                                <p className="text-[9px] text-theme-secondary uppercase tracking-tighter">Full database backup (JSON)</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-theme-secondary" />
                          </button>

                          <button 
                            onClick={() => {
                              if (confirm('CRITICAL: This will delete all simulations and payments. Admin user will remain. Continue?')) {
                                fetch(API_URL + '/api/admin/reset-db', { method: 'POST', headers: getAuthHeaders() })
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data.success) {
                                      showNotification(data.message, 'success');
                                      fetchActivityLogs();
                                    }
                                  });
                              }
                            }}
                            className="w-full p-4 bg-red-600/5 border border-red-600/20 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <Trash2 size={18} className="text-red-500 group-hover:text-white" />
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest">Reset Database</p>
                                <p className="text-[9px] opacity-70 uppercase tracking-tighter">Clear all non-user data</p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="opacity-50" />
                          </button>
                        </div>
                      </div>

                      {/* System Status */}
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-theme-primary">
                          <ShieldCheck className="text-red-500" size={20} />
                          System Status
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Database</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Connected
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">AI Engine</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Operational
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">GA4 Tracking</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : adminTab === 'stats' ? (
                  <div className="space-y-12">
                    {/* Top Row: Performance & Distribution */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Simulation Performance Chart */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Target className="text-red-500" size={24} />
                          Recent Scores
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={simulations.slice(-10)}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                              <XAxis 
                                dataKey="job_title" 
                                stroke={theme === 'dark' ? '#666' : '#999'} 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value && value.length > 15 ? value.substring(0, 12) + '...' : value}
                              />
                              <YAxis 
                                domain={[0, 10]}
                                stroke={theme === 'dark' ? '#666' : '#999'} 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={false}
                              />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Bar dataKey="score" fill="#dc2626" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Industry Distribution Pie Chart */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Briefcase className="text-red-500" size={24} />
                          Industry Focus
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={simulations.reduce((acc: any[], sim) => {
                                  const name = sim.industry || 'Other';
                                  const existing = acc.find(item => item.name === name);
                                  if (existing) existing.value += 1;
                                  else acc.push({ name, value: 1 });
                                  return acc;
                                }, []).sort((a, b) => b.value - a.value).slice(0, 5)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {simulations.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={['#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#000'][index % 5]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Score Trend & Activity */}
                    <div className="grid lg:grid-cols-2 gap-8">
                      {/* Average Score Trend */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Award className="text-red-500" size={24} />
                          Average Score Trend
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={simulations.reduce((acc: any[], sim) => {
                              const date = new Date(sim.created_at).toLocaleDateString();
                              const existing = acc.find(item => item.date === date);
                              if (existing) {
                                existing.totalScore += sim.score;
                                existing.count += 1;
                                existing.average = Number((existing.totalScore / existing.count).toFixed(1));
                              } else {
                                acc.push({ date, totalScore: sim.score, count: 1, average: sim.score });
                              }
                              return acc;
                            }, []).slice(-10)}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                              <XAxis dataKey="date" stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis domain={[0, 10]} stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px',
                                  fontSize: '12px'
                                }}
                              />
                              <Line type="monotone" dataKey="average" stroke="#dc2626" strokeWidth={3} dot={{ fill: '#dc2626', r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Activity Distribution */}
                      <div className="p-8 bg-theme-input border border-theme rounded-3xl">
                        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3 text-theme-primary">
                          <Activity className="text-red-500" size={24} />
                          Activity Distribution
                        </h3>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={[
                              { name: 'Logins', count: activityLogs.filter(l => l.activity === 'login_success').length },
                              { name: 'Signups', count: activityLogs.filter(l => l.activity === 'signup_success').length },
                              { name: 'Simulations', count: activityLogs.filter(l => l.activity === 'simulation_started').length },
                              { name: 'Upgrades', count: activityLogs.filter(l => l.activity === 'upgrade_clicked').length },
                            ]}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333' : '#eee'} vertical={false} />
                              <XAxis dataKey="name" stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <YAxis stroke={theme === 'dark' ? '#666' : '#999'} fontSize={10} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff',
                                  border: '1px solid #333',
                                  borderRadius: '12px'
                                }}
                              />
                              <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]}>
                                {activityLogs.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#dc2626' : '#991b1b'} />
                                ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Tracking Events */}
                    <div className="space-y-6">
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-6 flex items-center gap-2 text-theme-primary">
                          <Activity className="text-red-500" size={20} />
                          Live Tracking Events (GA4)
                        </h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {debugLogs.length === 0 ? (
                            <p className="text-[10px] text-theme-secondary uppercase tracking-widest text-center py-10 opacity-50">No events tracked yet</p>
                          ) : (
                            debugLogs.map((log, idx) => (
                              <div key={idx} className="p-4 bg-theme-surface-hover border border-theme rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{log.name}</span>
                                  <span className="text-[9px] text-theme-secondary opacity-50">{log.timestamp.toLocaleTimeString()}</span>
                                </div>
                                <pre className="text-[9px] font-mono text-theme-primary overflow-x-auto bg-black/20 p-2 rounded">
                                  {JSON.stringify(log.params, null, 2)}
                                </pre>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: SEO & Metadata */}
                    <div className="space-y-6">
                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-6 flex items-center gap-2 text-theme-primary">
                          <Search className="text-red-500" size={20} />
                          What Google Sees (SEO)
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-theme-surface-hover border border-theme rounded-xl">
                            <p className="text-[9px] text-theme-secondary uppercase tracking-widest mb-1 font-black">Page Title</p>
                            <p className="text-xs font-bold text-theme-primary">{document.title}</p>
                          </div>
                          <div className="p-4 bg-theme-surface-hover border border-theme rounded-xl">
                            <p className="text-[9px] text-theme-secondary uppercase tracking-widest mb-1 font-black">Meta Description</p>
                            <p className="text-xs text-theme-primary leading-relaxed">
                              {document.querySelector('meta[name="description"]')?.getAttribute('content') || 'No description found'}
                            </p>
                          </div>
                          <div className="p-4 bg-theme-surface-hover border border-theme rounded-xl">
                            <p className="text-[9px] text-theme-secondary uppercase tracking-widest mb-1 font-black">GA4 Measurement ID</p>
                            <p className="text-xs font-mono text-red-500">G-H2WWNHYJ2B</p>
                          </div>
                          <div className="p-4 bg-theme-surface-hover border border-theme rounded-xl">
                            <p className="text-[9px] text-theme-secondary uppercase tracking-widest mb-1 font-black">Canonical URL</p>
                            <p className="text-xs font-mono text-theme-secondary truncate">{window.location.origin}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <a 
                              href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(window.location.origin)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-4 bg-theme-surface-hover border border-theme rounded-xl hover:border-red-500 transition-colors text-center group"
                            >
                              <ExternalLink size={16} className="mx-auto mb-2 text-theme-secondary group-hover:text-red-500" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-theme-primary">Rich Results Test</span>
                            </a>
                            <a 
                              href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(window.location.origin)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-4 bg-theme-surface-hover border border-theme rounded-xl hover:border-red-500 transition-colors text-center group"
                            >
                              <ExternalLink size={16} className="mx-auto mb-2 text-theme-secondary group-hover:text-red-500" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-theme-primary">PageSpeed Insights</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                        <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-theme-primary">
                          <ShieldCheck className="text-red-500" size={20} />
                          Security Headers
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-theme-secondary uppercase tracking-widest">HTTPS</span>
                            <span className="text-emerald-500 font-black">ENABLED</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-theme-secondary uppercase tracking-widest">HSTS</span>
                            <span className="text-emerald-500 font-black">ACTIVE</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-theme-secondary uppercase tracking-widest">X-Frame-Options</span>
                            <span className="text-theme-primary font-black">SAMEORIGIN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto mt-4 md:mt-8 px-4 md:px-0 pb-12"
            >
              <div className="bg-theme-surface border border-theme rounded-3xl p-6 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
                    <div>
                      <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase italic text-theme-primary">Performance Report</h2>
                      <p className="text-red-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">{jobTitle}</p>
                    </div>
                  </div>

                  {isGeneratingSummary ? (
                    <div className="space-y-8 py-20">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <RefreshCw className="text-red-600 animate-spin" size={64} />
                        <p className="text-theme-secondary font-black uppercase tracking-[0.3em] animate-pulse">Analyzing Your Session</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none relative`}>
                        <div className="whitespace-pre-wrap text-theme-primary leading-relaxed text-base md:text-lg font-medium border-l-2 border-red-600 pl-4 md:pl-8 mb-12">
                          {summary}
                        </div>
                        
                        {/* Scroll Indicator - More prominent */}
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:hidden"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Scroll for Feedback</span>
                          <ChevronDown size={20} className="text-red-500 animate-bounce" />
                        </motion.div>
                      </div>

                      <div className="pt-8 md:pt-12 border-t border-theme flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <Tooltip content="Start a fresh interview session">
                          <button 
                            onClick={() => {
                              setStep('setup');
                              setMessages([]);
                              setSummary('');
                            }}
                            aria-label="Start new practice session"
                            className="flex-1 bg-red-600 text-white font-black uppercase tracking-[0.3em] py-6 rounded-2xl shadow-xl shadow-red-900/40 hover:bg-red-700 transition-all border border-red-500/20"
                          >
                            New Practice Session
                          </button>
                        </Tooltip>
                        <Tooltip content="Schedule a follow-up practice session">
                          <button 
                            onClick={() => {
                              setReminderTitle(`Practice: ${jobTitle}`);
                              setReminderDesc(`Review feedback from my ${jobTitle} interview simulation.`);
                              setIsScheduling(true);
                            }}
                            aria-label="Schedule practice"
                            className="px-10 py-6 bg-theme-surface-hover text-theme-primary font-black uppercase tracking-[0.2em] rounded-2xl hover:opacity-80 transition-all border border-theme flex items-center gap-3"
                          >
                            <Clock size={18} />
                            <span className="hidden md:inline">Schedule</span>
                          </button>
                        </Tooltip>
                        <Tooltip content="Download your performance report as a text file">
                          <button 
                            onClick={exportReport}
                            aria-label="Export report"
                            className="px-10 py-6 bg-theme-surface-hover text-theme-primary font-black uppercase tracking-[0.2em] rounded-2xl hover:opacity-80 transition-all border border-theme flex items-center gap-3"
                          >
                            <Download size={18} />
                            Export
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Global UI Elements (Modals & Notifications) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[1001] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 w-[calc(100%-2rem)] max-w-[400px] ${
              notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
              notification.type === 'error' ? 'bg-red-500 text-white border-red-400' :
              'bg-theme-surface border-theme text-theme-primary'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 size={20} className="text-white" />}
            {notification.type === 'error' && <AlertCircle size={20} className="text-white" />}
            {notification.type === 'info' && <Info size={20} className="text-blue-500" />}
            <p className="text-sm font-bold uppercase tracking-widest">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-auto p-1 hover:opacity-80 rounded-full">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={!!confirmModal?.isOpen}
        onClose={() => {
          setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
          setModalInputValue('');
        }}
        title={confirmModal?.title || 'Confirm Action'}
      >
        <div className="space-y-6">
          <p className="text-theme-secondary text-lg leading-relaxed">{confirmModal?.message}</p>
          
          {confirmModal?.showInput && (
            <div className="space-y-2">
              <textarea
                value={modalInputValue}
                onChange={(e) => setModalInputValue(e.target.value)}
                placeholder={confirmModal.inputPlaceholder || 'Enter details...'}
                className="w-full p-6 bg-theme-input border border-theme rounded-xl text-theme-primary text-base focus:border-red-500 outline-none transition-all min-h-[200px] resize-none"
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => {
                confirmModal?.onConfirm(modalInputValue);
                setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
                setModalInputValue('');
              }}
              className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-xl transition-all border border-red-500"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setConfirmModal(prev => prev ? { ...prev, isOpen: false } : null);
                setModalInputValue('');
              }}
              className="flex-1 py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary font-black uppercase tracking-widest rounded-xl transition-all border border-theme"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <AnimatePresence>
        {step === 'setup' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none md:hidden"
          >
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[8px] font-black uppercase tracking-widest text-theme-secondary opacity-50">Scroll for more options</span>
              <ChevronDown size={16} className="text-red-500" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
        title="Privacy Policy"
      >
        <div className="space-y-6 text-theme-secondary text-sm leading-relaxed">
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">1. Data Collection</h3>
            <p>EnvisionPaths collects minimal personal data required for account practice. This includes your email address and the job titles/industries you provide for practice sessions.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">2. Intelligent Processing</h3>
            <p>Your interview responses are processed by advanced intelligent models to provide feedback. We do not use your personal interview data to train public models. Your session data is used exclusively to generate your performance reports.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">3. Data Security</h3>
            <p>We implement industry-standard security measures to protect your information. All communications with our servers are encrypted via SSL/TLS.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">4. Your Rights</h3>
            <p>You have the right to access, correct, or delete your data at any time. Contact our expert support team for any data-related inquiries.</p>
          </section>
        </div>
      </Modal>

      {/* Simulation Details Modal */}
      <Modal
        isOpen={!!selectedSimulation}
        onClose={() => {
          setSelectedSimulation(null);
          setSimulationMessages([]);
        }}
        title="Simulation Details"
      >
        {selectedSimulation && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-theme-input border border-theme rounded-2xl">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-black tracking-widest mb-1">Role & Industry</p>
                <h3 className="text-sm font-black uppercase text-theme-primary">{selectedSimulation.job_title}</h3>
                <p className="text-[10px] text-theme-secondary uppercase font-bold">{selectedSimulation.industry}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-theme-secondary uppercase font-black tracking-widest mb-1">Final Score</p>
                <p className="text-3xl font-black italic text-red-500">{selectedSimulation.score}/10</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Performance Feedback</h3>
              <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} prose-xs max-w-none text-theme-primary leading-relaxed whitespace-pre-wrap`}>
                  {selectedSimulation.feedback}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Chat History</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <RefreshCw className="animate-spin text-red-500" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Loading transcript...</p>
                  </div>
                ) : simulationMessages.length > 0 ? (
                  simulationMessages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-red-600 text-white rounded-tr-none' 
                          : 'bg-theme-input border border-theme text-theme-primary rounded-tl-none'
                      }`}>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-2 opacity-50">
                          {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                        </p>
                        {msg.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-theme rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">No transcript available for this session.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedSimulation(null);
                setSimulationMessages([]);
              }}
              className="w-full py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme"
            >
              Close Details
            </button>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        title="Account Settings"
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Notifications</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">System Alerts</p>
                <p className="text-sm font-bold text-theme-primary">
                  {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Not Set'}
                </p>
              </div>
              {notificationPermission !== 'granted' && (
                <button 
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Enable Alerts
                </button>
              )}
              {notificationPermission === 'granted' && (
                <div className="text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-theme-secondary italic px-2">
              Enable alerts to receive notifications on your phone even when the app is in the background.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">App Installation</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-theme-primary">Install as an App</p>
              <p className="text-[10px] text-theme-secondary leading-relaxed">
                For the best experience and background alerts, install EnvisionPaths to your home screen:
              </p>
              <div className="text-[10px] text-theme-secondary space-y-1 bg-theme-surface p-3 rounded-xl border border-theme">
                <p>• <span className="text-theme-primary font-bold">iOS:</span> Tap <span className="inline-block px-1 bg-theme-surface-hover rounded border border-theme">Share</span> then <span className="text-theme-primary font-bold">"Add to Home Screen"</span></p>
                <p>• <span className="text-theme-primary font-bold">Android:</span> Tap <span className="inline-block px-1 bg-theme-surface-hover rounded border border-theme">Menu</span> then <span className="text-theme-primary font-bold">"Install App"</span></p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">System</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">App Version</p>
                <p className="text-sm font-bold text-theme-primary">v3.0.0</p>
              </div>
              <button 
                onClick={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      for (let registration of registrations) {
                        registration.update();
                      }
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-theme-surface-hover hover:opacity-80 text-theme-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-theme flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Check for Updates
              </button>
            </div>
            <p className="text-[10px] text-theme-secondary italic px-2">
              If you're not seeing the latest features on all devices, use this button to force a refresh.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Appearance</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">Color Theme</p>
                <p className="text-sm font-bold text-theme-primary">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  theme === 'light' 
                    ? 'bg-theme-primary text-theme-bg border-theme' 
                    : 'bg-theme-surface-hover text-theme-primary border-theme'
                }`}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Account Information</h3>
            <div className="bg-theme-input border border-theme rounded-2xl p-4">
              <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">Your Registered Email</p>
              <p className="text-sm font-bold text-theme-primary">{user?.email}</p>
            </div>
            <div className="bg-theme-input border border-theme rounded-2xl p-4">
              <p className="text-[10px] text-theme-secondary uppercase font-bold mb-1">Current Plan</p>
              <p className="text-sm font-bold text-red-500 uppercase tracking-widest">{user?.plan_type || 'Free'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Security & Account Updates</h3>
            
            {updateMessage && (
              <div className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${updateMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {updateMessage.text}
              </div>
            )}

            <div className="space-y-6">
              {/* Update Email Form */}
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <p className="text-[10px] text-theme-secondary uppercase font-bold">Update Your Email</p>
                <div className="flex gap-2">
                  <input 
                    type="email"
                    value={updateEmailValue}
                    onChange={(e) => setUpdateEmailValue(e.target.value)}
                    placeholder="Enter your new email"
                    className="flex-1 bg-theme-input border border-theme rounded-xl px-4 py-3 text-xs text-theme-primary focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isUpdatingEmail || !updateEmailValue}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 rounded-xl transition-all flex items-center justify-center"
                  >
                    {isUpdatingEmail ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  </button>
                </div>
              </form>

              {/* Update Password Form */}
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <p className="text-[10px] text-theme-secondary uppercase font-bold">Update Your Password</p>
                <div className="space-y-2">
                  <input 
                    type="password"
                    value={currentPasswordValue}
                    onChange={(e) => setCurrentPasswordValue(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 text-xs text-theme-primary focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <input 
                    type="password"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 text-xs text-theme-primary focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isUpdatingPassword || !currentPasswordValue || !newPasswordValue}
                    className="w-full py-3 bg-theme-surface-hover hover:opacity-80 disabled:opacity-50 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme flex items-center justify-center gap-2"
                  >
                    {isUpdatingPassword ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

          {!isAdmin && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Security</h3>
              <div className="p-6 bg-theme-input border border-theme rounded-2xl">
                <h3 className="text-sm font-black uppercase italic mb-4 flex items-center gap-2 text-theme-primary">
                  <Shield className="text-red-500" size={16} />
                  Two-Factor Authentication
                </h3>
                
                {twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">2FA is enabled</span>
                    </div>
                    <button 
                      onClick={async () => {
                        if (confirm('Disable 2FA? Your account will be less secure.')) {
                          const res = await fetch(API_URL + '/api/auth/disable-2fa', { method: 'POST', headers: getAuthHeaders() });
                          if (res.ok) setTwoFactorEnabled(false);
                        }
                      }}
                      className="w-full text-[10px] text-theme-secondary hover:text-red-500 transition-colors uppercase tracking-widest font-bold"
                    >
                      Disable 2FA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!isSettingUp2FA ? (
                      <div className="space-y-4">
                        <p className="text-[10px] text-theme-secondary leading-relaxed uppercase tracking-widest font-bold">
                          Secure your account with an authenticator app.
                        </p>
                        <button 
                          onClick={setup2FA}
                          className="w-full bg-theme-primary text-theme-bg font-black uppercase tracking-widest py-3 rounded-xl hover:opacity-90 transition-colors text-[10px]"
                        >
                          Setup 2FA
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-center p-4 bg-white rounded-xl">
                          <img src={qrCodeUrl} alt="2FA QR Code" className="w-32 h-32" />
                        </div>
                        <div className="space-y-4">
                          <p className="text-[8px] text-theme-secondary uppercase tracking-widest font-bold text-center">
                            Scan with your authenticator app
                          </p>
                          <form onSubmit={verify2FASetup} className="space-y-4">
                            <input 
                              type="text" 
                              placeholder="000000"
                              maxLength={6}
                              value={setupCode}
                              onChange={(e) => setSetupCode(e.target.value)}
                              className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 text-center font-mono tracking-[0.5em] text-theme-primary focus:border-red-500 outline-none transition-all text-xs"
                            />
                            <button 
                              type="submit"
                              className="w-full bg-red-600 text-white font-black uppercase tracking-widest py-3 rounded-xl hover:bg-red-700 transition-colors text-[10px]"
                            >
                              Verify & Enable
                            </button>
                            <button 
                              type="button"
                              onClick={() => setIsSettingUp2FA(false)}
                              className="w-full text-[8px] text-theme-secondary uppercase tracking-widest font-bold hover:text-theme-primary transition-colors"
                            >
                              Cancel
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Support & Legal</h3>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsPrivacyOpen(true);
                }}
                className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Privacy Policy</span>
                <ChevronRight size={14} className="text-theme-secondary" />
              </button>
              <button 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsTermsOpen(true);
                }}
                className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Terms of Service</span>
                <ChevronRight size={14} className="text-theme-secondary" />
              </button>
              <a 
                href="mailto:support@envisionpaths.com"
                className="flex items-center justify-between p-4 bg-theme-input border border-theme rounded-2xl hover:border-red-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={16} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">Contact Support</span>
                </div>
                <ChevronRight size={14} className="text-theme-secondary" />
              </a>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-theme-surface-hover hover:opacity-80 text-theme-primary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-theme flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </button>
            <p className="text-[8px] text-theme-secondary text-center uppercase font-bold tracking-widest">
              Deleting your account is permanent and cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
        title="Terms of Service"
      >
        <div className="space-y-6 text-theme-secondary text-sm leading-relaxed">
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">1. Acceptance of Terms</h3>
            <p>By accessing EnvisionPaths, you agree to be bound by these professional terms of service. Our platform is designed for professional development and career advancement practice.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">2. User Accounts</h3>
            <p>You are responsible for maintaining the security of your account and password. EnvisionPaths cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
          </section>
          <section>
            <h3 className="text-theme-primary font-bold uppercase tracking-widest mb-2">3. Practice Content</h3>
            <p>EnvisionPaths provides practice sessions for professional development. We do not guarantee employment or specific career outcomes. The performance score is a smart estimate based on your session input.</p>
          </section>
        </div>
      </Modal>

      <Modal 
        isOpen={isScheduling} 
        onClose={() => setIsScheduling(false)}
        title="Schedule Practice Session"
      >
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <Info size={14} />
            How to Set Alerts
          </p>
          <div className="text-xs text-theme-secondary mt-2 space-y-2">
            <p>1. Enter a title for your practice session.</p>
            <p>2. Choose the date and time for your reminder.</p>
            <p>3. Click "Schedule Session" to save.</p>
            <p className="text-blue-400/80 italic">Note: To receive alerts on your phone when the app is closed, make sure to enable "System Alerts" in Account Settings.</p>
          </div>
        </div>
        <form onSubmit={addReminder} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Session Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Mock Interview for Site Supervisor"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all text-sm font-bold text-theme-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Date</label>
              <input 
                type="date" 
                required
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full bg-theme-input border border-theme rounded-xl px-2 sm:px-4 py-3 outline-none focus:border-red-500 transition-all text-xs sm:text-sm font-bold text-theme-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Time</label>
              <input 
                type="time" 
                required
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full bg-theme-input border border-theme rounded-xl px-2 sm:px-4 py-3 outline-none focus:border-red-500 transition-all text-xs sm:text-sm font-bold text-theme-primary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-theme-secondary">Description (Optional)</label>
            <textarea 
              placeholder="Focus on behavioral questions and safety protocols..."
              value={reminderDesc}
              onChange={(e) => setReminderDesc(e.target.value)}
              className="w-full bg-theme-input border border-theme rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all text-sm font-bold h-24 resize-none text-theme-primary"
            />
          </div>
          <button 
            type="submit"
            disabled={isSchedulingLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
          >
            {isSchedulingLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule Session'
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
