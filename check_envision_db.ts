import Database from 'better-sqlite3';
try {
  const db = new Database('envision.db');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('TABLES in envision.db:', tables);
  if (tables.some(t => t.name === 'users')) {
    const users = db.prepare('SELECT id, email FROM users LIMIT 5').all();
    console.log('USERS in envision.db:', users);
  }
} catch (e) {
  console.error('Error checking envision.db:', e);
}
