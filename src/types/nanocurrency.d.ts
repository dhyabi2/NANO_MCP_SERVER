declare module 'nanocurrency' {
    export enum Unit {
        hex = 'hex',
        raw = 'raw',
        NANO = 'NANO'
    }

    export interface ConvertOptions {
        from: Unit;
        to: Unit;
    }

    export interface BlockOptions {
        account: string;
        previous: string;
        representative: string;
        balance: string;
        link?: string;
        work: string;
    }

    export interface OpenBlockOptions {
        account: string;
        representative: string;
        source: string;
        work: string;
    }

    export interface ReceiveBlockOptions {
        wallet: string;
        account: string;
        source: string;
        previous: string;
        work: string;
    }

    export interface SendBlockOptions {
        wallet: string;
        account: string;
        previous: string;
        representative: string;
        balance: string;
        amount: string;
        destination: string;
        work: string;
    }

    export interface Block {
        type: string;
        account: string;
        previous: string;
        representative: string;
        balance: string;
        link: string;
        signature?: string;
        work: string;
        hash: string;
    }

    export const tools: {
        validateAddress(address: string): boolean;
        getPublicKey(privateKey: string): string;
        sign(hash: string, privateKey: string): string;
    };

    export const block: {
        createOpen(options: OpenBlockOptions): Block;
        createReceive(options: ReceiveBlockOptions): Block;
        createSend(options: SendBlockOptions): Block;
    };

    export const wallet: {
        generate(): { seed: string; privateKey: string; publicKey: string; address: string };
    };

    export function convert(value: string, options: ConvertOptions): string;
} 