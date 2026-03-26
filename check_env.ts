import { appendFileSync } from 'node:fs';
appendFileSync('env_check.log', `GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}\n`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}`);
