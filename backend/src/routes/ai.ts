import { Router, Response } from 'express';
import { generateChatResponse } from '../services/ai.js';

const aiRouter = Router();

aiRouter.post('/chat', async (req: any, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 1000) {
      return res.status(400).json({ error: 'Message is required and must be under 1000 characters' });
    }

    const reply = await generateChatResponse(message.trim());
    return res.json({ reply });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return res.status(500).json({ error: error.message || 'AI service error' });
  }
});

export default aiRouter;
