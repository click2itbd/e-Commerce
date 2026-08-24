# =========================
# SERVER
# =========================
PORT=4000
NODE_ENV=development

# =========================
# FRONTEND / CORS
# =========================
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://click2itbd.com,https://www.click2itbd.com

# =========================
# FIREBASE
# =========================
# Option A: Service account JSON string (recommended for production)
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json


# =========================
# DYNADOT
# =========================
DYNADOT_API_KEY=
DYNADOT_API_URL=https://api.dynadot.com/api3.json
DYNADOT_SANDBOX_MODE=false
DYNADOT_EXCHANGE_RATE=121
DYNADOT_MARKUP_PERCENT=15

# =========================
# WHM / cPanel
# =========================
WHM_API_TYPE=cpanel
WHM_API_URL=https://server2025.click2it.bd:2087
WHM_API_TOKEN=
WHM_USERNAME=root
WHM_VERIFY_SSL=true
WHM_TIMEOUT_MS=15000

# =========================
# CLOUDLINUX (optional)
# =========================
CLOUDLINUX_ENABLED=false
CLOUDLINUX_API_URL=
CLOUDLINUX_API_TOKEN=
CLOUDLINUX_PARTNER_LOGIN=
CLOUDLINUX_SECRET_KEY=

# =========================
# SMTP
# =========================
SMTP_HOST=mail.click2itbd.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=click2itbd@gmail.com
SMTP_PASSWORD=Root@paas1981
SMTP_FROM_EMAIL=noreply@click2itbd.com
SMTP_FROM_NAME=CLICK2IT

# =========================
# PAYMENT
# =========================
MANUAL_PAYMENT_ENABLED=true
MANUAL_PAYMENT_SECRET=
MANUAL_BIKASH_NUMBER=+8801727666677

# =========================
# AI (optional)
# =========================
GEMINI_API_KEY=

# =========================
# WhatsApp (optional)
# =========================
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
