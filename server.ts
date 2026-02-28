import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Explicitly serve manifest and sw from public in dev
    app.get('/manifest.json', (req, res) => {
      console.log('Serving manifest.json');
      res.set('Content-Type', 'application/manifest+json');
      res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
    });

    app.get('/sw.js', (req, res) => {
      console.log('Serving sw.js');
      res.set('Content-Type', 'application/javascript');
      res.sendFile(path.join(__dirname, 'public', 'sw.js'));
    });

    // Serve icons folder
    app.use('/icons', express.static(path.join(__dirname, 'public', 'icons')));

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    // Handle SPA routing in development
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

    console.log('Vite middleware loaded in development mode');
  } else {
    // Serve static files from the 'dist' directory in production
    app.use(express.static(path.join(__dirname, 'dist')));
    
    // Handle SPA routing: return index.html for all non-API routes
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
