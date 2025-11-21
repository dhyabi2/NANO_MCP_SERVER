/**
 * Test for receiving all pending transactions for a specific account
 * Following TDD principles - Using MCP Built-in Methods Only
 */

const { describe, test, expect, beforeAll } = require('@jest/globals');

describe('Receive All Pending Transactions - Specific Account Test', () => {
    const testAccount = {
        address: 'nano_35jookk6m8yx5sei1x4x4ixoqg54iw3dfjczd9f89eborcjxb16wisbbquza',
        privateKey: '55496ae0f5aa....',
        publicKey: '8e35aca4499bdd1e5900745d143b5bb8628702b6c55f59da63b135c2a3d4809c'
    };

    let NanoTransactions;

    beforeAll(() => {
        console.log('='.repeat(60));
        console.log('TEST: Receive All Pending Transactions (MCP Built-in)');
        console.log('='.repeat(60));
        console.log('Account:', testAccount.address);
        console.log('Public Key:', testAccount.publicKey);
        console.log('='.repeat(60));
    });

    test('should have NanoTransactions module available', () => {
        expect(() => {
            NanoTransactions = require('../utils/nano-transactions').NanoTransactions;
        }).not.toThrow();
        expect(NanoTransactions).toBeDefined();
    });

    test('should verify account address is valid Nano format', () => {
        const { tools } = require('nanocurrency-web');
        
        const isValid = tools.validateAddress(testAccount.address);
        expect(isValid).toBe(true);
        
        console.log('✓ Account address is valid');
    });

    test('should verify public key matches account address', () => {
        const { tools } = require('nanocurrency-web');
        
        const derivedAddress = tools.publicKeyToAddress(testAccount.publicKey);
        expect(derivedAddress).toBe(testAccount.address);
        
        console.log('✓ Public key matches account address');
    });

    test('should check for pending blocks on the account', async () => {
        const { NanoTransactions } = require('../utils/nano-transactions');
        
        const nanoTx = new NanoTransactions({
            rpcNodes: [
                'https://uk1.public.xnopay.com/proxy',
                'https://node.somenano.com/proxy'
            ],
            rpcKey: null
        });

        console.log('\nChecking for pending blocks...');
        
        const pendingResult = await nanoTx.getPendingBlocks(testAccount.address);

        console.log('Pending blocks result:', JSON.stringify(pendingResult, null, 2));
        
        expect(pendingResult).toBeDefined();
        
        if (pendingResult.blocks) {
            const pendingCount = Object.keys(pendingResult.blocks).length;
            console.log(`\n✓ Found ${pendingCount} pending block(s)`);
            
            if (pendingCount > 0) {
                console.log('\nPending blocks details:');
                for (const [hash, info] of Object.entries(pendingResult.blocks)) {
                    console.log(`  - Hash: ${hash}`);
                    console.log(`    Amount (raw): ${info.amount}`);
                    if (info.source) {
                        console.log(`    Source: ${info.source}`);
                    }
                }
            }
        } else {
            console.log('\n✓ No pending blocks found or account not initialized yet');
        }
    }, 30000);

    test('should check account info', async () => {
        const { NanoTransactions } = require('../utils/nano-transactions');
        
        const nanoTx = new NanoTransactions({
            rpcNodes: [
                'https://uk1.public.xnopay.com/proxy',
                'https://node.somenano.com/proxy'
            ],
            rpcKey: null
        });

        console.log('\nChecking account info...');
        
        try {
            const accountInfo = await nanoTx.getAccountInfo(testAccount.address);
            console.log('Account info:', JSON.stringify(accountInfo, null, 2));
            
            console.log('✓ Account is opened');
            console.log(`  Balance (raw): ${accountInfo.balance}`);
            console.log(`  Frontier: ${accountInfo.frontier}`);
            console.log(`  Representative: ${accountInfo.representative}`);
        } catch (error) {
            if (error.message && error.message.includes('Account not found')) {
                console.log('✓ Account not yet opened (no blocks received)');
            } else {
                throw error;
            }
        }
    }, 30000);

    test('should receive all pending blocks using MCP built-in method', async () => {
        const { NanoTransactions } = require('../utils/nano-transactions');
        const { NanoConverter } = require('../utils/nano-converter');
        
        const nanoTx = new NanoTransactions({
            rpcNodes: [
                'https://uk1.public.xnopay.com/proxy',
                'https://node.somenano.com/proxy'
            ],
            rpcKey: null
        });

        console.log('\n' + '='.repeat(60));
        console.log('ATTEMPTING TO RECEIVE ALL PENDING BLOCKS');
        console.log('Using MCP Built-in receiveAllPending() Method');
        console.log('='.repeat(60));

        // Step 1: Check account status before receiving
        console.log('\n--- Account Status Before Receiving ---');
        let accountInfoBefore;
        try {
            accountInfoBefore = await nanoTx.getAccountInfo(testAccount.address);
            console.log(`Balance (raw): ${accountInfoBefore.balance}`);
            console.log(`Balance (XNO): ${NanoConverter.rawToXNO(accountInfoBefore.balance)}`);
            console.log(`Frontier: ${accountInfoBefore.frontier}`);
            console.log(`Block count: ${accountInfoBefore.block_count}`);
        } catch (error) {
            accountInfoBefore = null;
            console.log('Account not yet opened (will be opened with first receive)');
        }

        // Step 2: Check pending blocks
        console.log('\n--- Checking Pending Blocks ---');
        const pendingResult = await nanoTx.getPendingBlocks(testAccount.address);

        if (!pendingResult.blocks || Object.keys(pendingResult.blocks).length === 0) {
            console.log('⚠ No pending blocks to receive');
            console.log('This test will pass but no transactions were processed');
            expect(true).toBe(true);
            return;
        }

        const pendingCount = Object.keys(pendingResult.blocks).length;
        console.log(`Found ${pendingCount} pending block(s) to receive`);

        // Display pending blocks details
        console.log('\nPending blocks details:');
        for (const [hash, blockInfo] of Object.entries(pendingResult.blocks)) {
            console.log(`  - Hash: ${hash}`);
            console.log(`    Amount (raw): ${blockInfo.amount}`);
            console.log(`    Amount (XNO): ${NanoConverter.rawToXNO(blockInfo.amount)}`);
            if (blockInfo.source) {
                console.log(`    Source: ${blockInfo.source}`);
            }
        }

        // Step 3: Use MCP built-in receiveAllPending method
        console.log('\n' + '='.repeat(60));
        console.log('RECEIVING ALL PENDING BLOCKS');
        console.log('='.repeat(60));

        const results = await nanoTx.receiveAllPending(
            testAccount.address,
            testAccount.privateKey
        );

        // Step 4: Analyze results
        console.log('\n' + '='.repeat(60));
        console.log('RECEIVE RESULTS');
        console.log('='.repeat(60));

        let successful = 0;
        let failed = 0;
        const processedBlocks = [];
        const failedBlocks = [];

        results.forEach((result, idx) => {
            if (result.hash) {
                successful++;
                processedBlocks.push(result);
                console.log(`✓ Block ${idx + 1}: Successfully processed`);
                console.log(`  Hash: ${result.hash}`);
            } else if (result.error || result.errorCode) {
                failed++;
                failedBlocks.push(result);
                console.log(`✗ Block ${idx + 1}: Failed`);
                console.log(`  Error: ${result.error || result.message}`);
            }
        });

        console.log(`\nTotal pending blocks: ${pendingCount}`);
        console.log(`Successfully received: ${successful}`);
        console.log(`Failed: ${failed}`);

        // Step 5: Check final balance
        console.log('\n--- Final Account Status ---');
        const accountInfoAfter = await nanoTx.getAccountInfo(testAccount.address);

        if (accountInfoAfter && !accountInfoAfter.error) {
            console.log(`Balance (raw): ${accountInfoAfter.balance}`);
            console.log(`Balance (XNO): ${NanoConverter.rawToXNO(accountInfoAfter.balance)}`);
            console.log(`Frontier: ${accountInfoAfter.frontier}`);
            console.log(`Block count: ${accountInfoAfter.block_count}`);

            // Calculate difference if account existed before
            if (accountInfoBefore) {
                const balanceBefore = BigInt(accountInfoBefore.balance);
                const balanceAfter = BigInt(accountInfoAfter.balance);
                const difference = balanceAfter - balanceBefore;
                console.log(`\nBalance increase: ${difference.toString()} raw`);
                console.log(`Balance increase: ${NanoConverter.rawToXNO(difference.toString())} XNO`);
            }
        }

        console.log('='.repeat(60));

        // Test assertions
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        
        // At least one block should be successfully processed
        expect(successful).toBeGreaterThan(0);

    }, 120000); // 2 minute timeout for receiving multiple blocks
});
