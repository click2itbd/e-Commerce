import 'dotenv/config';
import { createApp } from './app';
import { requireFirebaseAuth } from './middleware/firebaseAuth';
import { config, validateEnvironment } from './config';

validateEnvironment();

const app = createApp();

const PORT = process.env.PORT || config.port || 4000;

const server = app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
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
