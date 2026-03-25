import Database from 'better-sqlite3';
const db = new Database('envision.db');
const users = db.prepare('SELECT id, email, is_admin, plan_type FROM users').all();
const sessions = db.prepare('SELECT * FROM sessions').all();
const simulations = db.prepare('SELECT id, user_id, status, created_at FROM simulations').all();
console.log('USERS:', JSON.stringify(users, null, 2));
console.log('SESSIONS:', JSON.stringify(sessions, null, 2));
console.log('SIMULATIONS:', JSON.stringify(simulations, null, 2));
