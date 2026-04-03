import express from 'express';
import fs from 'fs';
fs.writeFileSync('test_server.log', 'Test server started at ' + new Date().toISOString());
const app = express();
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => res.send('<h1>Test Server Running</h1>'));
app.listen(3000, '0.0.0.0', () => {
  console.log('Test server listening on port 3000');
});
