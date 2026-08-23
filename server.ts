import { createServer as createViteServer } from "vite";
import { createApp } from "./backend/src/app";
import { config, validateEnvironment } from "./backend/src/config";

async function startDevServer() {
  // Start backend API server on port 4000
  try {
    validateEnvironment();
    const backendApp = createApp();
    const backendPort = config.port || 4000;
    backendApp.listen(backendPort, '0.0.0.0', () => {
      console.log(`🚀 Backend API running on http://localhost:${backendPort}`);
    });
  } catch (err) {
    console.error('Failed to start backend API:', err);
  }

  // Start Vite frontend server on port 3000
  const vite = await createViteServer({
    server: { 
      port: 3000,
      host: true,
    },
    appType: "spa",
  });

  vite.httpServer?.listen(3000, '0.0.0.0', () => {
    console.log('⚡ Frontend dev server running on http://localhost:3000');
  });
}

startDevServer();
