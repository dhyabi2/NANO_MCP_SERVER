import { tools } from 'nanocurrency';

export function isValidXNOAddress(address: string): boolean {
    try {
        return tools.validateAddress(address);
    } catch {
        return false;
    }
}

export function isValidPrivateKey(privateKey: string): boolean {
    try {
        return /^[0-9A-F]{64}$/i.test(privateKey);
    } catch {
        return false;
    }
}

export function isValidHash(hash: string): boolean {
    try {
        return /^[0-9A-F]{64}$/i.test(hash);
    } catch {
        return false;
    }
}

export function isValidWork(work: string): boolean {
    try {
        return /^[0-9A-F]{16}$/i.test(work);
    } catch {
        return false;
    }
} 