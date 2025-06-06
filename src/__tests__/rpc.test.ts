import { NanoTransactions } from '../utils/nano-transactions';
import { config } from '../config/global';
import { TEST_ACCOUNT, TEST_BLOCK } from './setup';

describe('NANO RPC Operations', () => {
    let nano: NanoTransactions;

    beforeAll(async () => {
        // Initialize with test configuration
        await config.initializeConfig({
            rpcUrl: 'https://rpc.nano.to/',
            rpcKey: 'test_key',
            gpuKey: 'test_gpu_key',
            defaultRepresentative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
        });
        nano = new NanoTransactions();
    });

    describe('Work Generation', () => {
        test('should generate work for a block hash', async () => {
            const hash = TEST_BLOCK;
            const work = await nano.generateWork(hash);
            expect(work).toBeDefined();
            expect(typeof work).toBe('string');
            expect(work.length).toBeGreaterThan(0);
        });

        test('should handle invalid hash for work generation', async () => {
            const invalidHash = 'invalid_hash';
            await expect(nano.generateWork(invalidHash))
                .rejects
                .toThrow();
        });
    });

    describe('Send Operations', () => {
        const TEST_SEND_ACCOUNT = TEST_ACCOUNT;
        const TEST_RECEIVE_ACCOUNT = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
        const TEST_AMOUNT = '0.000001';

        test('should create send block', async () => {
            const accountInfo = await nano.getAccountInfo(TEST_SEND_ACCOUNT);
            const result = await nano.createSendBlock(
                TEST_SEND_ACCOUNT,
                'test_private_key', // Note: This will fail in production without a real private key
                TEST_RECEIVE_ACCOUNT,
                TEST_AMOUNT,
                accountInfo
            );
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('block');
        });

        test('should validate send parameters', async () => {
            await expect(nano.createSendBlock(
                'invalid_account',
                'test_private_key',
                TEST_RECEIVE_ACCOUNT,
                TEST_AMOUNT,
                {}
            )).rejects.toThrow();
        });
    });

    describe('Receive Operations', () => {
        test('should get pending blocks', async () => {
            const result = await nano.getPendingBlocks(TEST_ACCOUNT);
            expect(result).toBeDefined();
            expect(result).toHaveProperty('blocks');
        });

        test('should create receive block for pending transaction', async () => {
            const pending = await nano.getPendingBlocks(TEST_ACCOUNT);
            if (Object.keys(pending.blocks).length > 0) {
                const [hash, details] = Object.entries(pending.blocks)[0];
                const accountInfo = await nano.getAccountInfo(TEST_ACCOUNT);
                
                const result = await nano.receiveAllPending(
                    TEST_ACCOUNT,
                    'test_private_key' // Note: This will fail in production without a real private key
                );
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);
            } else {
                console.log('No pending blocks to test receive operation');
            }
        });

        test('should handle receive for account with no pending blocks', async () => {
            const result = await nano.receiveAllPending(
                'nano_1111111111111111111111111111111111111111111111111111hifc8npp',
                'test_private_key'
            );
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('Block Processing', () => {
        test('should create open block for new account', async () => {
            const sourceBlock = TEST_BLOCK;
            const sourceAmount = '1000000000000000000000000000000'; // 1 NANO in raw
            
            const result = await nano.createOpenBlock(
                'nano_1newaccount111111111111111111111111111111111111111111111111111',
                'test_private_key',
                sourceBlock,
                sourceAmount
            );
            expect(result).toBeDefined();
            expect(result).toHaveProperty('hash');
            expect(result).toHaveProperty('block');
        });

        test('should validate block parameters', async () => {
            await expect(nano.createOpenBlock(
                'invalid_account',
                'test_private_key',
                'invalid_block',
                'invalid_amount'
            )).rejects.toThrow();
        });
    });

    describe('RPC Error Handling', () => {
        test('should handle RPC connection errors', async () => {
            const badNano = new NanoTransactions({
                apiUrl: 'https://invalid.url/',
                rpcKey: 'invalid_key',
                gpuKey: 'invalid_key'
            });
            await expect(badNano.getAccountInfo(TEST_ACCOUNT))
                .rejects
                .toThrow();
        });

        test('should handle invalid RPC responses', async () => {
            await expect(nano.getAccountInfo('invalid_account'))
                .rejects
                .toThrow();
        });

        test('should handle work generation failures', async () => {
            const badNano = new NanoTransactions({
                apiUrl: 'https://rpc.nano.to/',
                rpcKey: 'invalid_key',
                gpuKey: 'invalid_key'
            });
            await expect(badNano.generateWork(TEST_BLOCK))
                .rejects
                .toThrow();
        });
    });
}); 