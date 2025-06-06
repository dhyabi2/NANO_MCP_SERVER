import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../logs');
const RPC_LOG_FILE = path.join(LOG_DIR, 'rpc_calls.log');
// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}
export function logRpcCall(entry) {
    const logEntry = JSON.stringify({
        ...entry,
        timestamp: new Date(entry.timestamp).toISOString(),
    }, null, 2);
    fs.appendFileSync(RPC_LOG_FILE, logEntry + '\n---\n');
}
