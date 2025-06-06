import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class Logger {
    constructor(logDir) {
        this.logDir = logDir;
        this.logFile = path.join(logDir, `test-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
        this.logs = [];
        // Create log directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }
    log(type, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            data
        };
        this.logs.push(logEntry);
        this._writeToFile();
        console.log(`[${type}]`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
    logError(type, error) {
        this.log(type, {
            message: error.message,
            stack: error.stack
        });
    }
    summarize(results) {
        this.log('TEST_SUMMARY', results);
    }
    _writeToFile() {
        fs.writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2));
    }
}
