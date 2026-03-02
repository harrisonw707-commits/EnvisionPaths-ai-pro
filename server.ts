import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Initialization
const db = new Database('envision.db');
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    plan_type TEXT DEFAULT 'free',
    plan_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const getSessionUser = (req: express.Request) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) return null;
    const session = db.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > CURRENT_TIMESTAMP').get(sessionId) as { user_id: number } | undefined;
    if (!session) return null;
    return db.prepare('SELECT id, email, plan_type, plan_start_date FROM users WHERE id = ?').get(session.user_id) as { id: number, email: string, plan_type: string, plan_start_date: string };
  };

  // API Routes
  app.post('/api/auth/signup', (req, res) => {
    const { email, password } = req.body;
    try {
      const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, password);
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime("now", "+7 days"))').run(sessionId, result.lastInsertRowid);
      res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true, user: { email, plan_type: 'free' } });
    } catch (e: any) {
      res.status(400).json({ error: e.message.includes('UNIQUE') ? 'Email already exists' : 'Signup failed' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT id, email, plan_type FROM users WHERE email = ? AND password = ?').get(email, password) as { id: number, email: string, plan_type: string } | undefined;
    if (user) {
      const sessionId = Math.random().toString(36).substring(2);
      db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime("now", "+7 days"))').run(sessionId, user.id);
      res.cookie('session_id', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ success: true, user: { email: user.email, plan_type: user.plan_type } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    res.clearCookie('session_id');
    res.json({ success: true });
  });

  app.get('/api/user/profile', (req, res) => {
    const user = getSessionUser(req);
    if (user) {
      const simulationsCount = db.prepare('SELECT COUNT(*) as count FROM simulations WHERE user_id = ? AND created_at > date("now", "start of month")').get(user.id) as { count: number };
      res.json({ user: { ...user, simulations_this_month: simulationsCount.count } });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  app.get('/api/simulations/history', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const history = db.prepare('SELECT id, job_title, industry, score, feedback, created_at FROM simulations WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    res.json({ history });
  });

  app.post('/api/simulations/start', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    // Plan Gating Logic
    if (user.plan_type === 'free') {
      const count = db.prepare('SELECT COUNT(*) as count FROM simulations WHERE user_id = ? AND created_at > date("now", "start of month")').get(user.id) as { count: number };
      if (count.count >= 2) {
        return res.status(403).json({ error: 'Free limit reached. Upgrade for more simulations.' });
      }
    } else if (user.plan_type === 'beginner') {
      const startDate = new Date(user.plan_start_date);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        // Downgrade to free if 30 days passed
        db.prepare('UPDATE users SET plan_type = "free" WHERE id = ?').run(user.id);
        return res.status(403).json({ error: 'Beginner plan expired. Please upgrade.' });
      }
    }

    res.json({ success: true });
  });

  app.post('/api/simulations/complete', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { job_title, industry, score, feedback } = req.body;
    db.prepare('INSERT INTO simulations (user_id, job_title, industry, score, feedback) VALUES (?, ?, ?, ?, ?)').run(user.id, job_title, industry, score, feedback);
    res.json({ success: true });
  });

  app.post('/api/user/upgrade', (req, res) => {
    const user = getSessionUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { plan_type } = req.body;
    db.prepare('UPDATE users SET plan_type = ?, plan_start_date = CURRENT_TIMESTAMP WHERE id = ?').run(plan_type, user.id);
    res.json({ success: true, plan_type });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
