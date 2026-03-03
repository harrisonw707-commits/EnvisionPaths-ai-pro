import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory log buffer for debugging
const logBuffer: string[] = [];
const originalLog = console.log;
const originalError = console.error;

process.on('uncaughtException', (err) => {
  originalError('[CRITICAL UNCAUGHT EXCEPTION]', err);
  logBuffer.push(`[${new Date().toISOString()}] CRITICAL ERROR: ${err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  originalError('[UNHANDLED REJECTION]', reason);
  logBuffer.push(`[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}`);
});

console.log = (...args: any[]) => {
  const msg = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  logBuffer.push(msg);
  if (logBuffer.length > 100) logBuffer.shift();
  originalLog.apply(console, args);
};

console.error = (...args: any[]) => {
  const msg = `[${new Date().toISOString()}] ERROR: ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  logBuffer.push(msg);
  if (logBuffer.length > 100) logBuffer.shift();
  originalError.apply(console, args);
};

// Lazy Stripe initialization
let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn('STRIPE_SECRET_KEY is not set. Stripe features will be disabled.');
      return null;
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

// Database Initialization
const db = new Database('envision.db', { timeout: 5000 });
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Create tables
console.log('[DB] Initializing tables...');
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    plan_type TEXT DEFAULT 'free',
    plan_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    stripe_customer_id TEXT,
    is_admin BOOLEAN DEFAULT 0,
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS processed_payments (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER,
    plan_type TEXT,
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_title TEXT,
    industry TEXT,
    score INTEGER,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    expires_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
  console.log('[DB] Tables initialized successfully');
} catch (e: any) {
  console.error('[DB] Error initializing tables:', e);
}

// Database Migrations: Ensure columns exist for existing databases
console.log('[SERVER] Running migrations...');
const migrations = [
  "ALTER TABLE users ADD COLUMN two_factor_secret TEXT",
  "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0",
  "ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0",
  "ALTER TABLE users ADD COLUMN stripe_customer_id TEXT",
  "ALTER TABLE users ADD COLUMN plan_type TEXT DEFAULT 'free'",
  "ALTER TABLE users ADD COLUMN plan_start_date DATETIME DEFAULT CURRENT_TIMESTAMP",
  "ALTER TABLE simulations ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
  "ALTER TABLE simulations ADD COLUMN status TEXT DEFAULT 'completed'",
  "CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON simulations(user_id)",
  "ALTER TABLE users ADD COLUMN email_verification_code TEXT",
  "ALTER TABLE users ADD COLUMN email_verification_expiry DATETIME"
];

for (const migration of migrations) {
  try {
    db.exec(migration);
    console.log(`[SERVER] Migration successful: ${migration.substring(0, 30)}...`);
  } catch (e: any) {
    // Ignore "duplicate column name" errors
    if (!e.message.includes('duplicate column name')) {
      console.warn(`[SERVER] Migration failed: ${migration}`, e.message);
    }
  }
}

// Ensure harrisonw707@gmail.com is an admin
console.log('[SERVER] Ensuring admin user...');
try {
  db.prepare("UPDATE users SET is_admin = 1 WHERE email = 'harrisonw707@gmail.com'").run();
} catch (e) {
  console.warn("[SERVER] Could not promote admin user:", e);
}

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';

console.log('[SERVER] Starting initialization...');

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Helper Functions (Defined at top of scope)
  const getSessionUser = (req: express.Request) => {
    const sessionId = req.cookies.session_id || req.headers['x-session-id'];
    
    if (!sessionId) {
      return null;
    }

    // Handle case where header might be an array
    const sid = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    
    try {
      console.log(`[AUTH] Verifying session: ${sid}`);
      
      // First check if session exists at all
      const sessionExists = db.prepare('SELECT user_id, expires_at FROM sessions WHERE id = ?').get(sid) as { user_id: number, expires_at: string } | undefined;
      
      if (!sessionExists) {
        console.log(`[AUTH] Session ID not found in database: ${sid}`);
        return null;
      }

      // Then check expiration using SQL for consistency
      const session = db.prepare(`
        SELECT user_id 
        FROM sessions 
        WHERE id = ? AND expires_at > datetime('now')
      `).get(sid) as { user_id: number } | undefined;
      
      if (!session) {
        console.log(`[AUTH] Session expired in DB: ${sid} (Expires at: ${sessionExists.expires_at}, Current DB time: ${db.prepare("SELECT datetime('now')").get()})`);
        return null;
      }

      const user = db.prepare(`
        SELECT id, email, plan_type, plan_start_date, is_admin, two_factor_enabled 
        FROM users 
        WHERE id = ?
      `).get(session.user_id) as any;

      if (!user) {
        console.log(`[AUTH] User not found for session: ${session.user_id}`);
        return null;
      }

      return user;
    } catch (e: any) {
      console.error(`[AUTH] DB Error in getSessionUser: ${e.message}`);
      return null;
    }
  };

  // 2. Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api')) {
        console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  app.use(express.json());
  app.use(cookieParser());

  console.log('[SERVER] Registering API routes...');

  // 3. Danger Zone / Debug Routes
  app.post('/api/debug/reset-server', (req, res) => {
    console.log('[DEBUG] Server reset requested');
    try {
      db.prepare('DELETE FROM sessions').run();
      db.prepare('DELETE FROM simulations').run();
      console.log('[DEBUG] Server state cleared');
      res.json({ success: true, message: 'Server state cleared' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Debug logs endpoint
  app.get('/api/debug/logs', (req, res) => {
    res.json({ logs: logBuffer });
  });

  // 1. Admin Login (Priority)
  app.post('/api/admin-login', (req, res) => {
    console.log(`[API] Entering /api/admin-login with body:`, req.body);
    try {
      const { email } = req.body;
      if (email === 'harrisonw707@gmail.com') {
        console.log('[API] Admin bypass triggered for harrisonw707@gmail.com');
        
        // Find or create user
        let user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any;
        if (!user) {
          console.log('[API] Creating new admin user');
          const result = db.prepare('INSERT INTO users (email, is_admin) VALUES (?, 1)').run(email);
          user = { id: Number(result.lastInsertRowid) };
        } else {
          db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(user.id);
        }

        const sessionId = 'admin_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        console.log(`[API] Creating session: ${sessionId}`);
        db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
        
        res.cookie('session_id', sessionId, { 
          httpOnly: true, 
          secure: true, 
          sameSite: 'none', 
          maxAge: 7 * 24 * 60 * 60 * 1000 
        });
        
        console.log('[API] Admin login success');
        return res.json({ success: true, sessionId });
      }
      console.log('[API] Admin login failed: Email mismatch');
      res.status(401).json({ success: false, error: 'Admin login failed.' });
    } catch (e: any) {
      console.error('[API] Admin login error:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 2. Profile (Priority)
  app.get('/api/user/profile', (req, res) => {
    console.log('[API] Entering /api/user/profile');
    try {
      const user = getSessionUser(req);
      if (user) {
        console.log(`[API] Profile found for: ${user.email}`);
        const simulationsCount = db.prepare("SELECT COUNT(*) as count FROM simulations WHERE user_id = ? AND created_at > date('now', 'start of month')").get(user.id) as { count: number };
        return res.json({ user: { ...user, simulations_this_month: simulationsCount.count } });
      }
      console.log('[API] No user session for profile');
      res.status(401).json({ error: 'Not authenticated' });
    } catch (e: any) {
      console.error('[API] Profile error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(), 
        db: 'connected',
        stats: { users: userCount.count }
      });
    } catch (e: any) {
      res.status(500).json({ status: 'error', error: e.message });
    }
  });

  app.get('/api/debug/logs', (req, res) => {
    res.json({ logs: logBuffer });
  });

  // Auth Middleware
  // (getSessionUser is defined at the top of startServer scope)

  // API Routes

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      let userId: number | bigint;
      try {
        const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);
        userId = result.lastInsertRowid;
      } catch (e: any) {
        if (e.message.includes('UNIQUE')) {
          // If it's the primary user, allow them to "reset" by signing up again
          if (email === 'harrisonw707@gmail.com') {
            db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
            const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number };
            userId = user.id;
          } else {
            return res.status(400).json({ error: 'Email already exists. Please sign in.' });
          }
        } else {
          throw e;
        }
      }
      
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, userId);
      res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true, user: { email, plan_type: 'free' } });
    } catch (e: any) {
      res.status(400).json({ error: 'Signup failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, email, password, plan_type, two_factor_enabled FROM users WHERE email = ?').get(email) as { id: number, email: string, password: string, plan_type: string, two_factor_enabled: number } | undefined;
    
    if (user) {
      console.log(`[LOGIN] User found: ${email}, comparing password...`);
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`[LOGIN] Password match: ${isMatch}`);
      if (isMatch) {
        if (user.two_factor_enabled) {
          return res.json({ success: true, requires_2fa: true, user_id: user.id });
        }
        const sessionId = Math.random().toString(36).substring(2);
        db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
        res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
        return res.json({ success: true, user: { email: user.email, plan_type: user.plan_type }, sessionId });
      }
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });

  app.post('/api/auth/send-email-code', (req, res) => {
    const { user_id } = req.body;
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(user_id) as { id: number, email: string } | undefined;
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    db.prepare('UPDATE users SET email_verification_code = ?, email_verification_expiry = ? WHERE id = ?').run(code, expiry, user.id);

    // In a real app, you would send an email here.
    // For this environment, we log it to the console.
    console.log(`[AUTH] EMAIL VERIFICATION CODE FOR ${user.email}: ${code}`);
    
    res.json({ success: true, message: 'Verification code sent to your email.' });
  });

  app.post('/api/auth/verify-email-code', (req, res) => {
    const { user_id, code } = req.body;
    const user = db.prepare('SELECT id, email, plan_type, email_verification_code, email_verification_expiry FROM users WHERE id = ?').get(user_id) as { id: number, email: string, plan_type: string, email_verification_code: string, email_verification_expiry: string } | undefined;
    
    if (!user) return res.status(401).json({ error: 'Invalid request' });

    const now = new Date().toISOString();
    if (user.email_verification_code === code && user.email_verification_expiry > now) {
      // Clear the code after use
      db.prepare('UPDATE users SET email_verification_code = NULL, email_verification_expiry = NULL WHERE id = ?').run(user.id);

      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
      res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true, user: { email: user.email, plan_type: user.plan_type }, sessionId });
    } else {
      res.status(401).json({ error: 'Invalid or expired verification code' });
    }
  });

  app.post('/api/auth/login-2fa', (req, res) => {
    const { user_id, token } = req.body;
    const user = db.prepare('SELECT id, email, plan_type, two_factor_secret FROM users WHERE id = ?').get(user_id) as { id: number, email: string, plan_type: string, two_factor_secret: string } | undefined;
    
    if (!user || !user.two_factor_secret) return res.status(401).json({ error: 'Invalid 2FA request' });

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token
    });

    if (isValid) {
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(sessionId, user.id);
      res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true, user: { email: user.email, plan_type: user.plan_type } });
    } else {
      res.status(401).json({ error: 'Invalid 2FA code' });
    }
  });

  app.post('/api/admin/reset-db', async (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

    try {
      // Clear all tables except users (to keep the admin logged in)
      db.prepare('DELETE FROM sessions WHERE user_id != ?').run(user.id);
      db.prepare('DELETE FROM simulations').run();
      db.prepare('DELETE FROM processed_payments').run();
      
      // Reset the admin's own state if needed
      db.prepare('UPDATE users SET plan_type = \'free\', two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?').run(user.id);
      
      res.json({ success: true, message: 'Database reset successfully. You remain logged in.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/setup-2fa', async (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

    const secret = speakeasy.generateSecret({ name: `EnvisionAdmin:${user.email}` });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?').run(secret.base32, user.id);
    res.json({ secret: secret.base32, qrCodeUrl });
  });

  app.post('/api/admin/verify-2fa', (req, res) => {
    const user = getSessionUser(req);
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });

    const { token } = req.body;
    const dbUser = db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(user.id) as { two_factor_secret: string };
    
    const isValid = speakeasy.totp.verify({
      secret: dbUser.two_factor_secret,
      encoding: 'base32',
      token
    });

    if (isValid) {
      db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(user.id);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.cookies.session_id || req.headers['x-session-id'];
    if (sessionId) db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    res.clearCookie('session_id');
    res.json({ success: true });
  });

  app.get('/api/simulations/history', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const history = db.prepare("SELECT id, job_title, industry, score, feedback, created_at FROM simulations WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC").all(user.id);
    res.json({ history });
  });

  app.post('/api/simulations/start', (req, res) => {
    console.log(`[SIMULATION] Start request received for user...`);
    try {
      const user = getSessionUser(req);
      if (!user) {
        console.warn('[SIMULATION] Start failed: Not authenticated');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { job_title, industry } = req.body;

      console.log(`[SIMULATION] Starting for user ${user.id} (${user.email}) - Plan: ${user.plan_type}`);

      // Plan Gating Logic (Count started and completed simulations, but not glitched ones)
      if (user.plan_type === 'free') {
        const count = db.prepare("SELECT COUNT(*) as count FROM simulations WHERE user_id = ? AND status IN ('started', 'completed') AND created_at > date('now', 'start of month')").get(user.id) as { count: number };
        console.log(`[SIMULATION] User ${user.id} has ${count.count} active simulations this month`);
        if (count.count >= 2) {
          return res.status(403).json({ error: 'Free limit reached. Upgrade for more simulations.' });
        }
      } else if (user.plan_type === 'beginner') {
        const startDate = new Date(user.plan_start_date || Date.now());
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`[SIMULATION] User ${user.id} beginner plan age: ${diffDays} days`);
        if (diffDays > 30) {
          // Downgrade to free if 30 days passed
          console.log(`[SIMULATION] Downgrading user ${user.id} to free plan`);
          db.prepare('UPDATE users SET plan_type = "free" WHERE id = ?').run(user.id);
          return res.status(403).json({ error: 'Beginner plan expired. Please upgrade.' });
        }
      }

      // Create a "started" record to track the session
      const result = db.prepare('INSERT INTO simulations (user_id, job_title, industry, status) VALUES (?, ?, ?, ?)').run(user.id, job_title || 'Unknown', industry || 'Unknown', 'started');
      const simulationId = result.lastInsertRowid;

      console.log(`[SIMULATION] Simulation ${simulationId} started for user ${user.id}`);
      res.json({ success: true, simulation_id: simulationId });
    } catch (e: any) {
      console.error(`[SIMULATION START ERROR] ${e.message}`, e.stack);
      res.status(500).json({ error: 'Failed to start simulation: ' + e.message });
    }
  });

  app.post('/api/simulations/report-glitch', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    const { simulation_id } = req.body;
    if (!simulation_id) return res.status(400).json({ error: 'Simulation ID required' });

    try {
      // Mark the simulation as glitched so it doesn't count
      const result = db.prepare("UPDATE simulations SET status = 'glitched' WHERE id = ? AND user_id = ? AND status = 'started'").run(simulation_id, user.id);
      
      if (result.changes > 0) {
        console.log(`[SIMULATION] Simulation ${simulation_id} marked as glitched by user ${user.id}`);
        res.json({ success: true, message: 'Glitch reported. This session has been refunded.' });
      } else {
        res.status(400).json({ error: 'Could not report glitch for this session. It may already be completed or not found.' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/simulations/complete', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { simulation_id, job_title, industry, score, feedback } = req.body;
    
    if (simulation_id) {
      db.prepare("UPDATE simulations SET job_title = ?, industry = ?, score = ?, feedback = ?, status = 'completed' WHERE id = ? AND user_id = ?").run(job_title, industry, score, feedback, simulation_id, user.id);
    } else {
      // Fallback for older clients
      db.prepare("INSERT INTO simulations (user_id, job_title, industry, score, feedback, status) VALUES (?, ?, ?, ?, ?, 'completed')").run(user.id, job_title, industry, score, feedback);
    }
    res.json({ success: true });
  });

  // Stripe Checkout Session Creation
  app.post('/api/create-checkout-session', async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { plan_type } = req.body;
    const stripeClient = getStripe();
    if (!stripeClient) return res.status(500).json({ error: 'Stripe is not configured' });

    const prices: Record<string, string> = {
      beginner: 'price_beginner_id', // Replace with real price IDs
      pro: 'price_pro_id'
    };

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    try {
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `EnvisionPaths ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} Plan`,
              },
              unit_amount: plan_type === 'beginner' ? 500 : 1500, // $5 or $15
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}&plan_type=${plan_type}`,
        cancel_url: `${appUrl}/pricing`,
        customer_email: user.email,
        metadata: {
          user_id: user.id.toString(),
          plan_type
        }
      });

      res.json({ url: session.url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Stripe Session Verification
  app.post('/api/verify-session', async (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'Session ID required' });

    // 1. Check if session was already processed (Replay Protection)
    const alreadyProcessed = db.prepare('SELECT 1 FROM processed_payments WHERE session_id = ?').get(session_id);
    if (alreadyProcessed) {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    const stripeClient = getStripe();
    if (!stripeClient) return res.status(500).json({ error: 'Stripe is not configured' });

    try {
      // 2. Fetch session from Stripe using secret key (expanding line_items to see what was bought)
      const session = await stripeClient.checkout.sessions.retrieve(session_id, {
        expand: ['line_items']
      });
      
      // 3. Strict Verification: Must be paid, complete, and a valid checkout mode
      const isPaid = session.payment_status === 'paid';
      const isComplete = session.status === 'complete';
      const isValidMode = session.mode === 'payment' || session.mode === 'subscription';

      if (isPaid && isComplete && isValidMode) {
        // 4. Authoritative Source: Strict Price ID Whitelisting (The Law)
        const PRICE_MAP: Record<string, string> = {
          'price_beginner_id': 'beginner',
          'price_pro_id': 'pro'
        };

        const lineItem = session.line_items?.data?.[0];
        const priceId = lineItem?.price?.id;
        const plan_type = priceId ? PRICE_MAP[priceId] : undefined;

        if (!plan_type) {
          console.error(`[STRIPE ERROR] Unknown or missing Price ID (${priceId}) for session ${session_id}. Rejection mandatory.`);
          return res.status(400).json({ error: 'Unauthorized product: Price ID not whitelisted' });
        }

        // 5. Safety Net: Validate amount and currency
        const amount = session.amount_total;
        const currency = session.currency?.toLowerCase();
        const expectedAmount = plan_type === 'beginner' ? 500 : 1500;

        if (currency !== 'usd' || (amount && amount < expectedAmount)) {
          console.error(`[STRIPE ERROR] Amount/Currency safety check failed for session ${session_id}. Expected >= ${expectedAmount} usd, got ${amount} ${currency}`);
          return res.status(400).json({ error: 'Payment amount or currency mismatch' });
        }

        // 6. Customer Verification: Ensure session belongs to this user
        const client_ref = session.client_reference_id;
        const meta_user_id = session.metadata?.user_id;
        const stripe_customer_id = session.customer as string;

        // Verify user ID matches
        const isUserMatch = (client_ref === user.id.toString()) || (meta_user_id === user.id.toString());
        if (!isUserMatch) {
          console.warn(`[STRIPE] Unauthorized attempt for session ${session_id}. User ID mismatch.`);
          return res.status(403).json({ error: 'Session does not belong to this user' });
        }

        // Verify Stripe Customer ID matches if already set for this user
        const currentUser = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(user.id) as any;
        if (currentUser?.stripe_customer_id && stripe_customer_id && currentUser.stripe_customer_id !== stripe_customer_id) {
          console.warn(`[STRIPE] Customer ID mismatch for user ${user.id}. Expected ${currentUser.stripe_customer_id}, got ${stripe_customer_id}`);
          return res.status(403).json({ error: 'Stripe customer mismatch: This account is already linked to a different Stripe customer' });
        }

        // 7. Atomic Upgrade
        const upgradeTransaction = db.transaction(() => {
          // Update plan and associate customer ID if not already set (Persistence on first payment)
          db.prepare(`
            UPDATE users 
            SET plan_type = ?, 
                plan_start_date = CURRENT_TIMESTAMP,
                stripe_customer_id = COALESCE(stripe_customer_id, ?)
            WHERE id = ?
          `).run(plan_type, stripe_customer_id, user.id);
          
          // Mark the session as "consumed"
          db.prepare('INSERT INTO processed_payments (session_id, user_id, plan_type) VALUES (?, ?, ?)').run(session_id, user.id, plan_type);
        });

        upgradeTransaction();
        
        console.log(`[STRIPE] Plan ${plan_type} unlocked for user ${user.id} via session ${session_id}`);
        return res.json({ success: true, plan_type });
      }
      res.status(400).json({ error: 'Payment not verified' });
    } catch (e: any) {
      console.error(`[STRIPE ERROR] ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  // Catch-all for unknown API routes to prevent falling through to SPA fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    app.get('*', async (req, res, next) => {
      if (req.url.startsWith('/api')) return next();
      try {
        const html = await vite.transformIndexHtml(req.url, 'index.html');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[GLOBAL ERROR]', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ 
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message 
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
