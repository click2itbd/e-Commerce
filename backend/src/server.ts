import 'dotenv/config';
import './services/networkDns.js';
import http from 'http';
import { createApp } from './app.js';
import { config, validateEnvironment } from './config/index.js';
import { setupExpiryReminders } from './jobs/expiryReminders.js';
import { setupDatabaseBackupCron } from './jobs/databaseBackup.js';

validateEnvironment();

const app = createApp();

// Primary server listening on port 4000 for Apache / LiteSpeed reverse proxy (.htaccess RewriteRule)
const server = app.listen(4000, '0.0.0.0', () => {
  console.log(`[Backend API] Successfully listening on 0.0.0.0:4000 (Apache Reverse Proxy target)`);
  
  // Initialize Background Jobs
  try {
    setupExpiryReminders();
  } catch (cronErr) {
    console.error('Failed to setup expiry reminders cron:', cronErr);
  }

  try {
    setupDatabaseBackupCron();
  } catch (backupErr) {
    console.error('Failed to setup database backup cron:', backupErr);
  }
});

server.on('error', (err: any) => {
  console.error(`[Server 4000 Error] ${err?.message || err}`);
  if (err?.code === 'EADDRINUSE') {
    console.warn(`[Server 4000 Notice] Port 4000 is already in use by another running backend process.`);
  }
});

// Also bind to Passenger PORT/socket if CloudLinux Passenger launched the app
const passengerPort = process.env.PORT;
let passengerServer: http.Server | null = null;
if (passengerPort && String(passengerPort) !== '4000') {
  try {
    passengerServer = http.createServer(app);
    passengerServer.listen(passengerPort, () => {
      console.log(`[Backend API] Also listening on CloudLinux Passenger port/socket: ${passengerPort}`);
    });
    passengerServer.on('error', (err: any) => {
      console.error(`[Passenger Server Error] ${err?.message || err}`);
    });
  } catch (passengerErr) {
    console.warn(`[Passenger Bind Warning]`, passengerErr);
  }
}

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err?.stack || err?.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('SIGTERM', () => {
  server.close(() => {
    if (passengerServer) passengerServer.close();
    console.log('Backend server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    if (passengerServer) passengerServer.close();
    console.log('Backend server closed gracefully');
    process.exit(0);
  });
});

export default app;
