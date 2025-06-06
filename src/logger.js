import fs from 'fs';
import path from 'path';

export class Logger {
    constructor(logDir) {
        this.logDir = logDir;
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getLogFilePath(type) {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDir, `${type}_${date}.log`);
    }

    formatLogEntry(data) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}\n`;
    }

    log(type, data) {
        const logPath = this.getLogFilePath(type);
        const logEntry = this.formatLogEntry(data);
        
        fs.appendFileSync(logPath, logEntry);
    }

    logError(type, error) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            ...(error.response && { response: error.response }),
        };
        this.log(`ERROR_${type}`, errorData);
    }
} 