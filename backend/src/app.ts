import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler } from "./middleware/errorHandler.js";
import domainRouter from "./routes/domain.js";
import hostingRouter from "./routes/hosting.js";
import ordersRouter from "./routes/orders.js";
import publicRouter from "./routes/public.js";
import adminRouter from "./routes/admin.js";
import aiRouter from "./routes/ai.js";
import emailRouter from "./routes/email.js";
import webhookRouter from "./routes/webhook.js";
import campaignRouter from "./routes/campaign.js";

export function createApp(): Express {
  const app = express();

  app.use(requestId);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://apis.google.com",
            "https://www.google.com",
            "https://www.gstatic.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https://images.unsplash.com",
            "https://placehold.co",
          ],
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
            "https://firebaseappcheck.googleapis.com",
          ],
          fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: [
            "'self'",
            "https://*.firebaseapp.com",
            "https://*.google.com",
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  const allowedOrigins = [
    "https://click2itbd.com",
    "https://www.click2itbd.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    ...(config.cors?.origins || []),
  ];

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman) or matched origins
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Idempotency-Key",
      "X-Request-ID",
      "X-Requested-With",
    ],
    optionsSuccessStatus: 204,
  };

  // Apply CORS globally and handle preflight requests
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(cors(corsOptions));
  app.use(express.json({ limit: config.bodyLimit }));
  app.set("trust proxy", 1);

  const isDev = process.env.NODE_ENV !== "production";

  const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.generalMax,
    message: { error: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev,
  });

  const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMax,
    message: {
      error: "Too many authentication attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev,
  });

  const sensitiveLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.sensitiveMax,
    message: { error: "Too many requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isDev,
  });

  const healthHandler = (req: express.Request, res: express.Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  };

  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  const apiRouter = express.Router();

  apiRouter.use("/send-email", sensitiveLimiter);
  apiRouter.use("/webhook/whatsapp", sensitiveLimiter);
  apiRouter.use("/send-whatsapp-campaign", sensitiveLimiter);
  apiRouter.post("/auth/login", authLimiter);
  apiRouter.post("/auth/register", authLimiter);
  apiRouter.post("/auth/forgot-password", authLimiter);
  apiRouter.post("/auth/otp", authLimiter);
  apiRouter.use("/ai/chat", sensitiveLimiter);

  apiRouter.use(generalLimiter);

  apiRouter.use("/public", publicRouter);
  apiRouter.use("/domains", domainRouter);
  apiRouter.use("/hosting", hostingRouter);
  apiRouter.use("/send-email", emailRouter);
  apiRouter.use("/orders", ordersRouter);
  apiRouter.use("/admin", adminRouter);
  apiRouter.use("/ai", aiRouter);
  apiRouter.use("/webhook", webhookRouter);
  apiRouter.use("/send-whatsapp-campaign", campaignRouter);

  app.use("/api", apiRouter);
  app.use("/", apiRouter);

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: "API Endpoint Not Found" });
  });

  app.all("/*", (req, res) => {
    res.status(404).json({ error: "API Endpoint Not Found" });
  });

  app.use(errorHandler);

  return app;
}
