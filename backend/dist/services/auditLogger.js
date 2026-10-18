import { getAdminDb } from '../firebase/admin.js';
export function extractClientIp(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.trim())
        return cfIp.trim();
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim())
        return realIp.trim();
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
        return String(forwardedFor[0]).split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}
export function extractUserAgent(req) {
    const ua = req.headers['user-agent'];
    if (typeof ua === 'string' && ua.trim())
        return ua.trim();
    return 'unknown';
}
export async function recordAdminActivityLog(req, input) {
    try {
        const db = getAdminDb();
        const now = new Date().toISOString();
        const ipAddress = req ? extractClientIp(req) : input.ipAddress || 'server';
        const userAgent = req ? extractUserAgent(req) : input.userAgent || 'server';
        const reqUser = req?.user;
        const logRecord = {
            action: input.action || 'EDIT',
            entityType: input.entityType || 'System',
            details: input.details || '',
            performedBy: input.performedBy || reqUser?.email || reqUser?.uid || 'Admin',
            adminUid: input.adminUid || reqUser?.uid || '',
            adminEmail: input.adminEmail || reqUser?.email || '',
            ipAddress,
            userAgent,
            immutable: true,
            timestamp: now,
            ...(input.entityId ? { entityId: input.entityId } : {}),
            ...(input.previousState !== undefined ? { previousState: input.previousState } : {}),
            ...(input.newState !== undefined ? { newState: input.newState } : {}),
        };
        const docRef = db.collection('audit_logs').doc();
        await docRef.set(logRecord);
        return docRef.id;
    }
    catch (error) {
        console.error('[AuditLogger] Failed to write immutable admin activity log:', error);
        return null;
    }
}
