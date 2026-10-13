import "./backend/src/services/networkDns";
import { createServer as createViteServer } from "vite";
import { createApp } from "./backend/src/app";
import { validateEnvironment } from "./backend/src/config";
import type { Server } from "http";

async function startDevServer() {
  let backendServer: Server | null = null;
  const backendPort = 4000;

  // 1. Start backend API server on port 4000
  try {
    validateEnvironment();
    const backendApp = createApp();
    backendServer = backendApp.listen(backendPort, '0.0.0.0', () => {
      console.log(`🚀 Backend API running on http://localhost:${backendPort}`);
    });

    backendServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Backend API] Port ${backendPort} is already in use by an active instance.`);
      } else {
        console.error('[Backend API] Server error:', err);
      }
    });
  } catch (err) {
    console.error('Failed to initialize backend API:', err);
  }

  // 2. Start Vite frontend server on port 3000
  try {
    const vite = await createViteServer({
      server: { 
        port: 3000,
        host: '0.0.0.0',
      },
      appType: "spa",
    });

    await vite.listen(3000);
    console.log('⚡ Frontend dev server running on http://localhost:3000');

    // Clean shutdown handlers
    const shutdown = async () => {
      console.log('Shutting down dev servers...');
      if (backendServer) {
        backendServer.close();
      }
      await vite.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.warn('[Frontend Dev Server] Port 3000 is already in use.');
    } else {
      console.error('Failed to start Vite frontend server:', err);
    }
  }
}

startDevServer();
