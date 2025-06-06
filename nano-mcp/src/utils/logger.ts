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

export interface RpcLogEntry {
  timestamp: string;
  action: string;
  params: Record<string, any>;
  response: any;
  duration: number;
  error?: string;
}

export function logRpcCall(entry: RpcLogEntry): void {
  const logEntry = JSON.stringify({
    ...entry,
    timestamp: new Date(entry.timestamp).toISOString(),
  }, null, 2);

  fs.appendFileSync(RPC_LOG_FILE, logEntry + '\n---\n');
}

export class Logger {
    private logDir: string;

    constructor(logDir: string) {
        this.logDir = logDir;
        this.ensureLogDirectory();
    }

    private ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private getLogFilePath(type: string): string {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `${type}_${date}.log`);
    }

    private writeLog(type: string, data: any) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${JSON.stringify(data, null, 2)}\n`;
        fs.appendFileSync(this.getLogFilePath(type), logEntry);
    }

    log(type: string, data: any) {
        this.writeLog(type, data);
    }

    logError(type: string, error: any) {
        this.writeLog(`ERROR_${type}`, {
            message: error.message,
            stack: error.stack,
            ...error
        });
    }
} 