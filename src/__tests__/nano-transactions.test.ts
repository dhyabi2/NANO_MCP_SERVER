import { NanoTransactions } from '../utils/nano-transactions';
import dotenv from 'dotenv';

dotenv.config();

describe('NanoTransactions', () => {
    let nano: NanoTransactions;

    beforeEach(() => {
        nano = new NanoTransactions({
            apiUrl: 'https://rpc.nano.to/',
            rpcKey: process.env.RPC_KEY || '',
            gpuKey: process.env.GPU_KEY || 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
        });
    });

    describe('generateWork', () => {
        it('should generate work for a given hash', async () => {
            const hash = '000000000000000000000000000000000000000000000000000000000000000A';
            const work = await nano.generateWork(hash);
            expect(work).toBeDefined();
            expect(typeof work).toBe('string');
        });
    });

    describe('getAccountInfo', () => {
        it('should get account information', async () => {
            const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            const info = await nano.getAccountInfo(account);
            expect(info).toBeDefined();
        });
    });

    describe('getPendingBlocks', () => {
        it('should get pending blocks', async () => {
            const account = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
            const pending = await nano.getPendingBlocks(account);
            expect(pending).toBeDefined();
        });
    });

    describe('createOpenBlock', () => {
        it('should create an open block', async () => {
            if (process.env.TEST_OPEN === 'true') {
                const address = process.env.TEST_ADDRESS;
                const privateKey = process.env.TEST_PRIVATE_KEY;
                const sourceBlock = process.env.TEST_SOURCE_BLOCK;
                const sourceAmount = process.env.TEST_SOURCE_AMOUNT || '0.0001';

                expect(address).toBeDefined();
                expect(privateKey).toBeDefined();
                expect(sourceBlock).toBeDefined();

                const result = await nano.createOpenBlock(address!, privateKey!, sourceBlock!, sourceAmount);
                expect(result).toBeDefined();
            } else {
                console.log('Skipping open block test - TEST_OPEN not enabled');
            }
        });
    });

    describe('createSendBlock', () => {
        it('should create a send block', async () => {
            if (process.env.TEST_SEND === 'true') {
                const fromAddress = process.env.SOURCE_ADDRESS;
                const privateKey = process.env.SOURCE_PRIVATE_KEY;
                const toAddress = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
                const amount = '0.00001';

                expect(fromAddress).toBeDefined();
                expect(privateKey).toBeDefined();

                const accountInfo = await nano.getAccountInfo(fromAddress!);
                expect(accountInfo).toBeDefined();
                expect(accountInfo.error).toBeUndefined();

                const result = await nano.createSendBlock(fromAddress!, privateKey!, toAddress, amount, accountInfo);
                expect(result).toBeDefined();
            } else {
                console.log('Skipping send block test - TEST_SEND not enabled');
            }
        });
    });

    describe('receiveAllPending', () => {
        it('should receive all pending blocks', async () => {
            if (process.env.TEST_RECEIVE === 'true') {
                const address = process.env.RECEIVE_ADDRESS;
                const privateKey = process.env.RECEIVE_PRIVATE_KEY;

                expect(address).toBeDefined();
                expect(privateKey).toBeDefined();

                const result = await nano.receiveAllPending(address!, privateKey!);
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);
            } else {
                console.log('Skipping receive blocks test - TEST_RECEIVE not enabled');
            }
        });
    });
}); 