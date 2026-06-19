import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  app.post("/api/check-domain", async (req, res) => {
    const { domain } = req.body;
    // In a real scenario, you'd use a domain registrar API here (e.g., Namecheap, GoDaddy)
    // Example: const isAvailable = await registrarApi.check(domain);
    
    // Simulating API check
    const isAvailable = domain.length > 5; 
    
    res.json({
        status: isAvailable ? 'available' : 'taken',
        message: isAvailable ? `Great news! ${domain} is available.` : `Sorry, ${domain} is already taken.`
    });
  });

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "Star Tech <onboarding@resend.dev>", // Replace with your verified domain in production
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

  // WhatsApp Webhook endpoint
  app.get("/api/webhook/whatsapp", (req, res) => {
    // WhatsApp verification challenge
    const verify_token = process.env.WHATSAPP_VERIFY_TOKEN || "startech_secret_token";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token) {
      if (mode === "subscribe" && token === verify_token) {
        console.log("WEBHOOK_VERIFIED");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });

  app.post("/api/webhook/whatsapp", async (req, res) => {
    const body = req.body;

    console.log("Incoming WhatsApp Webhook:", JSON.stringify(body, null, 2));

    if (body.object) {
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
        
        // Setup Chatbot logic here
        // If message is "hi", trigger automated response or save lead
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });

  // Send WhatsApp Message Campaign (Mocked real integration)
  app.post("/api/send-whatsapp-campaign", async (req, res) => {
    const { leads, message } = req.body;
    console.log(`Starting WhatsApp campaign for ${leads.length} leads...`);
    console.log(`Message: ${message}`);
    
    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
      console.warn("WHATSAPP_ACCESS_TOKEN is not set. Simulating campaign success.");
      return res.status(200).json({ success: true, dummy: true, message: "Campaign simulated successfully. (Add WHATSAPP_ACCESS_TOKEN to send real messages)" });
    }

    try {
        // Example of a real Meta API call:
        // await axios.post(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        //   messaging_product: "whatsapp", to: mobile, type: "template", template: { name: templateName, language: { code: "en_US" } }
        // }, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } })
        
        res.status(200).json({ success: true, sentCount: leads.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  // Vite middleware for development
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
