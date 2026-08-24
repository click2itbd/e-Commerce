import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load backend/.env regardless of where the process is started from
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
  origins: (process.env.CORS_ORIGINS || 'https://click2itbd.com,https://www.click2itbd.com,http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(o => o.trim()),
},
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    generalMax: 100,
    authMax: 10,
    sensitiveMax: 20,
  },
  bodyLimit: '10kb',
  requestTimeout: 15000,
  secrets: {
    expressApiKey: process.env.EXPRESS_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    whmApiType: process.env.WHM_API_TYPE,
    whmApiUrl: process.env.WHM_API_URL,
    whmApiToken: process.env.WHM_API_TOKEN,
    whmApiKey: process.env.WHM_API_KEY,
    whmUsername: process.env.WHM_USERNAME,
    dynadotApiKey: process.env.DYNADOT_API_KEY,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    manualPaymentSecret: process.env.MANUAL_PAYMENT_SECRET,
    manualBikashNumber: process.env.MANUAL_BIKASH_NUMBER,
    firebaseServiceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    fromName: process.env.SMTP_FROM_NAME || 'Click2IT',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@click2itbd.com',
  },
  cloudlinux: {
    enabled: process.env.CLOUDLINUX_ENABLED || 'false',
    apiUrl: process.env.CLOUDLINUX_API_URL || '',
    apiToken: process.env.CLOUDLINUX_API_TOKEN || '',
    partnerLogin: process.env.CLOUDLINUX_PARTNER_LOGIN || '',
    secretKey: process.env.CLOUDLINUX_SECRET_KEY || '',
  },
};

export function validateEnvironment(): void {
  const missing: string[] = [];
  
  if (!config.secrets.whmApiToken && !config.secrets.whmApiKey) {
    missing.push('WHM_API_TOKEN');
  }
  if (!config.secrets.whmApiUrl) {
    missing.push('WHM_API_URL');
  }
  if (!config.secrets.dynadotApiKey) {
    missing.push('DYNADOT_API_KEY');
  }
  
  if (missing.length > 0) {
    console.warn('Missing recommended environment variables:');
    missing.forEach(name => console.warn(`  - ${name}`));
    console.warn('Some features may not work without these variables.');
  }

  const firebaseKey = config.secrets.firebaseServiceAccountKey?.trim();
  if (firebaseKey) {
    try {
      let parsed: any;
      if (firebaseKey.endsWith('.json') || firebaseKey.startsWith('.') || firebaseKey.includes('/') || firebaseKey.includes('\\')) {
        const absolutePath = path.isAbsolute(firebaseKey)
          ? firebaseKey
          : path.resolve(__dirname, '..', '..', firebaseKey);
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        parsed = JSON.parse(fileContent);
      } else {
        parsed = JSON.parse(firebaseKey);
      }
      if (!parsed || typeof parsed !== 'object') {
        console.error('[Config] FIREBASE_SERVICE_ACCOUNT_KEY is not a valid JSON object.');
      } else if (parsed.type !== 'service_account') {
        console.error('[Config] FIREBASE_SERVICE_ACCOUNT_KEY has invalid type field.');
      } else if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
        console.error('[Config] FIREBASE_SERVICE_ACCOUNT_KEY is missing required fields.');
      }
    } catch {
      console.error('[Config] FIREBASE_SERVICE_ACCOUNT_KEY contains malformed JSON or invalid file path.');
    }
  }
}
