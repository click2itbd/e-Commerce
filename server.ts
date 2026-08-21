import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import domainRouter from "./server/routes/domain";
import hostingRouter from "./server/routes/hosting";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
};

const requireApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  const expectedKey = process.env.EXPRESS_API_KEY;
  
  if (!expectedKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }
  
  if (apiKey && apiKey.toString().replace('Bearer ', '') === expectedKey) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://placehold.co"],
        connectSrc: ["'self'", "https://api.dynadot.com", "https://api-sandbox.dynadot.com", "https://cln.cloudlinux.com"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10kb" }));
  app.use(generalLimiter);

  app.use("/api/send-email", sensitiveLimiter);
  app.use("/api/webhook/whatsapp", sensitiveLimiter);
  app.use("/api/send-whatsapp-campaign", sensitiveLimiter);
  app.post("/api/auth/login", authLimiter);
  app.post("/api/auth/register", authLimiter);
  app.post("/api/auth/forgot-password", authLimiter);
  app.post("/api/auth/otp", authLimiter);

  app.post("/api/send-email", requireApiKey, async (req, res) => {
    const { to, subject, html } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "Star Tech <onboarding@resend.dev>",
        to,
        subject,
        html,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(400).json({ error });
      }

      res.status(200).json({ data });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/webhook/whatsapp", (req, res) => {
    const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!verify_token) {
      return res.sendStatus(403);
    }
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === verify_token) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(403);
    }
  });

  app.post("/api/webhook/whatsapp", async (req, res) => {
    const body = req.body;

    if (!body.object) {
      return res.sendStatus(404);
    }

    console.log("Incoming WhatsApp Webhook:", JSON.stringify(body, null, 2));

    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const phoneNumber = body.entry[0].changes[0].value.contacts[0].wa_id;
      const name = body.entry[0].changes[0].value.contacts[0].profile.name;
      const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

      console.log(`Received message from ${name} (${phoneNumber}): ${msgBody}`);
    }

    res.sendStatus(200);
  });

  app.post("/api/send-whatsapp-campaign", async (req, res) => {
    const { leads, message } = req.body;
    console.log(`Starting WhatsApp campaign for ${leads.length} leads...`);
    console.log(`Message: ${message}`);

    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      console.warn("WHATSAPP_ACCESS_TOKEN is not set. Cannot send WhatsApp campaign.");
      return res.status(500).json({ success: false, error: "WhatsApp API not configured. Please set WHATSAPP_ACCESS_TOKEN." });
    }

    try {
      res.status(200).json({ success: true, sentCount: leads.length });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  app.use('/api/domain', domainRouter);
  app.use('/api/hosting', hostingRouter);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
