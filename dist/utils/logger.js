"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Logger {
    constructor(logDir) {
        this.logDir = logDir;
        this.ensureLogDirectory();
    }
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
    }
    getTimestamp() {
        return new Date().toISOString();
    }
    writeLog(type, data) {
        const timestamp = this.getTimestamp();
        const logEntry = {
            timestamp,
            type,
            data
        };
        const logFile = path_1.default.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs_1.default.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
    log(type, data = {}) {
        this.writeLog(type, data);
    }
    logError(type, error) {
        const errorData = {
            message: error.message || error,
            stack: error.stack,
            ...error
        };
        this.writeLog(`ERROR_${type}`, errorData);
    }
}
exports.Logger = Logger;
