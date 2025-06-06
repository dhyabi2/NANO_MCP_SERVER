import { tools } from 'nanocurrency';
export function isValidXNOAddress(address) {
    try {
        return tools.validateAddress(address);
    }
    catch {
        return false;
    }
}
export function isValidPrivateKey(privateKey) {
    try {
        return /^[0-9A-F]{64}$/i.test(privateKey);
    }
    catch {
        return false;
    }
}
export function isValidHash(hash) {
    try {
        return /^[0-9A-F]{64}$/i.test(hash);
    }
    catch {
        return false;
    }
}
export function isValidWork(work) {
    try {
        return /^[0-9A-F]{16}$/i.test(work);
    }
    catch {
        return false;
    }
}
