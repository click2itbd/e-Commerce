import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import domainRouter from './routes/domain';
import hostingRouter from './routes/hosting';
import ordersRouter from './routes/orders';
import publicRouter from './routes/public';
import adminRouter from './routes/admin';
import aiRouter from './routes/ai';
import emailRouter from './routes/email';
import webhookRouter from './routes/webhook';
import campaignRouter from './routes/campaign';

export function createApp(): Express {
  const app = express();

  app.use(requestId);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.google.com", "https://www.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://placehold.co"],
        connectSrc: [
          "'self'", 
          "https://api.dynadot.com", 
          "https://api-sandbox.dynadot.com", 
          "https://cln.cloudlinux.com", 
          "https://securetoken.googleapis.com", 
          "https://identitytoolkit.googleapis.com", 
          "https://firestore.googleapis.com", 
          "https://*.cloudfunctions.net", 
          "https://firebasestorage.googleapis.com", 
          "https://www.google.com", 
          "https://www.gstatic.com",
          "https://content-firebaseappcheck.googleapis.com",
          "https://firebaseappcheck.googleapis.com"
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://*.firebaseapp.com", "https://*.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || config.cors.origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: config.bodyLimit }));
  app.set('trust proxy', 1);

  const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.generalMax,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMax,
    message: { error: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const sensitiveLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.sensitiveMax,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', generalLimiter);

  app.use('/api/send-email', sensitiveLimiter);
  app.use('/api/webhook/whatsapp', sensitiveLimiter);
  app.use('/api/send-whatsapp-campaign', sensitiveLimiter);
  app.post('/api/auth/login', authLimiter);
  app.post('/api/auth/register', authLimiter);
  app.post('/api/auth/forgot-password', authLimiter);
  app.post('/api/auth/otp', authLimiter);

  app.use('/api/ai/chat', sensitiveLimiter);
  app.use('/api/domain', domainRouter);
  app.use('/api/hosting', hostingRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/send-email', emailRouter);
  app.use('/api/webhook', webhookRouter);
  app.use('/api/send-whatsapp-campaign', campaignRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', generalLimiter);

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API Endpoint Not Found' });
  });

  app.use(errorHandler);

  return app;
}
