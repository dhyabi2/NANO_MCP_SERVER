import fs from 'fs';
import path from 'path';

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

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private writeLog(type: string, data: any) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            type,
            data
        };

        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }

    log(type: string, data: any = {}) {
        this.writeLog(type, data);
    }

    logError(type: string, error: Error | any) {
        const errorData = {
            message: error.message || error,
            stack: error.stack,
            ...error
        };
        this.writeLog(`ERROR_${type}`, errorData);
    }
} 