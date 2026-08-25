import 'dotenv/config';
import { createApp } from './app';
import { requireFirebaseAuth } from './middleware/firebaseAuth';
import { config, validateEnvironment } from './config';

validateEnvironment();

const app = createApp();

const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Backend server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Backend server closed');
    process.exit(0);
  });
});

export default app;
