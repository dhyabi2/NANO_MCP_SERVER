"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidXNOAddress = isValidXNOAddress;
exports.isValidPrivateKey = isValidPrivateKey;
exports.isValidHash = isValidHash;
exports.isValidWork = isValidWork;
const nanocurrency_1 = require("nanocurrency");
function isValidXNOAddress(address) {
    try {
        return nanocurrency_1.tools.validateAddress(address);
    }
    catch {
        return false;
    }
}
function isValidPrivateKey(privateKey) {
    try {
        return /^[0-9A-F]{64}$/i.test(privateKey);
    }
    catch {
        return false;
    }
}
function isValidHash(hash) {
    try {
        return /^[0-9A-F]{64}$/i.test(hash);
    }
    catch {
        return false;
    }
}
function isValidWork(work) {
    try {
        return /^[0-9A-F]{16}$/i.test(work);
    }
    catch {
        return false;
    }
}
