export declare class Logger {
    private logDir;
    constructor(logDir: string);
    private ensureLogDirectory;
    private getTimestamp;
    private writeLog;
    log(type: string, data?: any): void;
    logError(type: string, error: Error | any): void;
}
