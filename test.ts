import { appendFileSync } from 'fs';
appendFileSync('test.log', 'Hello from tsx\n');
console.log('Test script finished');
