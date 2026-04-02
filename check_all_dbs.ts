import Database from 'better-sqlite3';
import fs from 'fs';
const files = fs.readdirSync('.');
const dbFiles = files.filter(f => f.endsWith('.db'));
console.log('DB files found:', dbFiles);
for (const f of dbFiles) {
  try {
    const db = new Database(f);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`TABLES in ${f}:`, tables);
    if (tables.some(t => t.name === 'users')) {
      const users = db.prepare('SELECT id, email FROM users LIMIT 5').all();
      console.log(`USERS in ${f}:`, users);
    }
  } catch (e) {
    console.error(`Error checking ${f}:`, e);
  }
}
