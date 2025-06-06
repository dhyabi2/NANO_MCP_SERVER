import fs from 'fs';
import path from 'path';

export class Logger {
    constructor(logDir) {
        this.logDir = logDir;
        this.logFile = path.join(logDir, `test-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(type, message) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message: typeof message === 'string' ? message : JSON.stringify(message, null, 2)
        };

        const logString = JSON.stringify(logEntry);
        fs.appendFileSync(this.logFile, logString + '\n');
    }

    logError(type, error) {
        const errorObj = {
            message: error.message,
            stack: error.stack,
            ...(error.response ? { response: error.response } : {})
        };
        this.log(type, errorObj);
    }

    summarize(results) {
        const summary = {
            timestamp: new Date().toISOString(),
            type: 'TEST_SUMMARY',
            results
        };
        fs.appendFileSync(this.logFile, JSON.stringify(summary, null, 2) + '\n');
    }
} 