import { Router } from 'express';
import { generateChatResponse, polishText } from '../services/ai.js';
const aiRouter = Router();
aiRouter.post('/chat', async (req, res) => {
    try {
        const { message, history, context, mode } = req.body;
        if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 1500) {
            return res.status(400).json({ error: 'Message is required and must be under 1500 characters' });
        }
        const sanitizedHistory = Array.isArray(history)
            ? history
                .filter((h) => h && (h.sender === 'user' || h.sender === 'bot') && typeof h.text === 'string')
                .slice(-8)
                .map((h) => ({ sender: h.sender, text: h.text.slice(0, 1000) }))
            : undefined;
        const sanitizedContext = context && typeof context === 'object'
            ? {
                currentPath: typeof context.currentPath === 'string' ? context.currentPath.slice(0, 200) : undefined,
                pageTitle: typeof context.pageTitle === 'string' ? context.pageTitle.slice(0, 120) : undefined,
                cartCount: typeof context.cartCount === 'number' ? context.cartCount : undefined,
                cartTotal: typeof context.cartTotal === 'number' ? context.cartTotal : undefined,
            }
            : undefined;
        const reply = await generateChatResponse(message.trim(), {
            history: sanitizedHistory,
            context: sanitizedContext,
            mode: mode === 'storefront_chat' ? 'storefront_chat' : 'general',
        });
        return res.json({ reply });
    }
    catch (error) {
        console.error('AI chat error:', error);
        return res.status(500).json({ error: error.message || 'AI service error' });
    }
});
aiRouter.post('/polish', async (req, res) => {
    try {
        const { text, context, targetLang } = req.body;
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required to polish' });
        }
        if (text.length > 10000) {
            return res.status(400).json({ error: 'Text must be under 10,000 characters' });
        }
        const polished = await polishText(text.trim(), { context, targetLang });
        return res.json({ success: true, polished });
    }
    catch (error) {
        console.error('AI polish error:', error);
        return res.status(500).json({ error: error.message || 'AI polish failed' });
    }
});
export default aiRouter;
