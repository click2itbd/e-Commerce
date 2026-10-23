import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import { getAdminDb } from '../firebase/admin.js';
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const COLLECTIONS_TO_BACKUP = [
    'orders',
    'transactions',
    'products',
    'customers',
    'vendors',
    'purchases',
    'sale_returns',
    'purchase_returns',
    'services',
    'users',
    'cash_register',
    'tasks',
    'menus',
    'settings',
];
/**
 * Executes a full backup of all business & accounting collections to disk.
 */
export async function runDatabaseBackupNow() {
    const db = getAdminDb();
    const startTime = new Date();
    const dateStr = startTime.toISOString().replace(/[:.]/g, '-');
    const targetFolder = path.join(BACKUP_DIR, `backup-${dateStr}`);
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    fs.mkdirSync(targetFolder, { recursive: true });
    const collectionCounts = {};
    let totalRecords = 0;
    let totalSizeBytes = 0;
    console.log(`[Backup] Starting automated database backup at ${startTime.toISOString()}...`);
    try {
        for (const colName of COLLECTIONS_TO_BACKUP) {
            const snap = await db.collection(colName).get();
            const records = [];
            snap.forEach((doc) => {
                records.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            collectionCounts[colName] = records.length;
            totalRecords += records.length;
            const filePath = path.join(targetFolder, `${colName}.json`);
            const jsonContent = JSON.stringify(records, null, 2);
            fs.writeFileSync(filePath, jsonContent, 'utf8');
            totalSizeBytes += Buffer.byteLength(jsonContent, 'utf8');
        }
        const summary = {
            timestamp: startTime.toISOString(),
            folderName: path.basename(targetFolder),
            totalRecords,
            collectionCounts,
            totalSizeKb: Math.round(totalSizeBytes / 1024),
            status: 'completed',
        };
        fs.writeFileSync(path.join(targetFolder, 'backup_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
        console.log(`[Backup] Successfully completed backup of ${totalRecords} records across ${COLLECTIONS_TO_BACKUP.length} collections (${Math.round(totalSizeBytes / 1024)} KB)`);
        // Auto-rotate old backups: keep last 30 backups
        rotateOldBackups(30);
        return {
            success: true,
            folderName: path.basename(targetFolder),
            timestamp: startTime.toISOString(),
            totalRecords,
            collectionCounts,
            totalSizeKb: Math.round(totalSizeBytes / 1024),
        };
    }
    catch (err) {
        console.error('[Backup] Database backup failed:', err);
        return {
            success: false,
            folderName: path.basename(targetFolder),
            timestamp: startTime.toISOString(),
            totalRecords,
            collectionCounts,
            totalSizeKb: Math.round(totalSizeBytes / 1024),
            error: err?.message || 'Unknown error during backup',
        };
    }
}
/**
 * Removes backups older than maxCount to prevent disk exhaustion.
 */
function rotateOldBackups(maxCount = 30) {
    try {
        if (!fs.existsSync(BACKUP_DIR))
            return;
        const items = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('backup-'));
        items.sort(); // Lexicographical sort works because of ISO date format
        if (items.length > maxCount) {
            const toDelete = items.slice(0, items.length - maxCount);
            for (const folder of toDelete) {
                const fullPath = path.join(BACKUP_DIR, folder);
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`[Backup] Rotated out old backup: ${folder}`);
            }
        }
    }
    catch (err) {
        console.warn('[Backup] Error during backup rotation:', err);
    }
}
/**
 * Returns a list of all existing backups with metadata.
 */
export function getBackupHistory() {
    try {
        if (!fs.existsSync(BACKUP_DIR))
            return [];
        const items = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('backup-'));
        items.sort().reverse();
        return items.map((folder) => {
            const summaryFile = path.join(BACKUP_DIR, folder, 'backup_summary.json');
            if (fs.existsSync(summaryFile)) {
                try {
                    const content = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
                    return {
                        folderName: folder,
                        timestamp: content.timestamp,
                        totalRecords: content.totalRecords,
                        sizeKb: content.totalSizeKb,
                    };
                }
                catch (_) { }
            }
            return { folderName: folder };
        });
    }
    catch (err) {
        console.warn('[Backup] Failed to read backup history:', err);
        return [];
    }
}
/**
 * Schedules daily automated database backup at midnight (00:00).
 */
export function setupDatabaseBackupCron() {
    // '0 0 * * *' = everyday at 00:00 (Midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Midnight reached. Triggering automated database backup...');
        await runDatabaseBackupNow();
    });
    console.log('[CRON] Automated database backup job scheduled for midnight daily (00:00).');
}
