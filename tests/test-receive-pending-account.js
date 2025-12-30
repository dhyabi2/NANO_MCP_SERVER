#!/usr/bin/env node

/**
 * Standalone script to receive all pending transactions for a specific account
 * This script provides comprehensive logging and debugging information
 * 
 * Account: nano_35jookk6m8yx5sei1x4x4ixoqg54iw3dfjczd9f89eborcjxb16wisbbquza
 * Public Key: 8e35aca4499bdd1e5900745d143b5bb8628702b6c55f59da63b135c2a3d4809c
 * Private Key: 55496ae0f5.......................
 */

const { tools, block, wallet } = require('nanocurrency-web');
const { NanoTransactions } = require('../utils/nano-transactions');
const { NanoConverter } = require('../utils/nano-converter');

// Configure account credentials
const ACCOUNT = {
    address: 'nano_35jookk6m8yx5sei1x4x4ixoqg54iw3dfjczd9f89eborcjxb16wisbbquza',
    privateKey: '55496ae0.........................................',
    publicKey: '8e35aca4499bdd1e5900745d143b5bb8628702b6c55f59da63b135c2a3d4809c'
};

// Configure RPC
const RPC_CONFIG = {
    rpcNodes: ['https://rpc.nano.to'],
    rpcKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23'
};

// Logging utility
function logSection(title) {
    console.log('\n' + '='.repeat(80));
    console.log(title);
    console.log('='.repeat(80));
}

function logSubSection(title) {
    console.log('\n' + '-'.repeat(80));
    console.log(title);
    console.log('-'.repeat(80));
}

function logInfo(message, data = null) {
    console.log(`[INFO] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

function logError(message, error = null) {
    console.error(`[ERROR] ${message}`);
    if (error) {
        console.error(error);
    }
}

function logSuccess(message) {
    console.log(`[SUCCESS] ✓ ${message}`);
}

function logWarning(message) {
    console.warn(`[WARN] ⚠ ${message}`);
}

function logDebug(message, data = null) {
    console.log(`[DEBUG] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

/**
 * Validate account credentials
 */
function validateAccountCredentials() {
    logSubSection('Validating Account Credentials');
    
    try {
        // Validate address format
        logInfo('Validating address format...');
        const isValidAddress = tools.validateAddress(ACCOUNT.address);
        if (!isValidAddress) {
            throw new Error('Invalid Nano address format');
        }
        logSuccess('Address format is valid');

        // Validate public key matches address
        logInfo('Validating public key matches address...');
        const derivedAddress = tools.publicKeyToAddress(ACCOUNT.publicKey);
        if (derivedAddress !== ACCOUNT.address) {
            throw new Error(`Public key does not match address. Expected: ${ACCOUNT.address}, Got: ${derivedAddress}`);
        }
        logSuccess('Public key matches address');

        // Validate private/public key pair
        logInfo('Validating private/public key pair...');
        // Use the keyPair function to derive public key from private key
        const nanocurrency = require('nanocurrency');
        const derivedPublicKey = nanocurrency.derivePublicKey(ACCOUNT.privateKey);
        if (derivedPublicKey.toLowerCase() !== ACCOUNT.publicKey.toLowerCase()) {
            throw new Error(`Private key does not match public key. Expected: ${ACCOUNT.publicKey}, Got: ${derivedPublicKey}`);
        }
        logSuccess('Private/Public key pair is valid');

        logSuccess('All credential validations passed');
        return true;
    } catch (error) {
        logError('Credential validation failed', error);
        throw error;
    }
}

/**
 * Check account status on the network
 */
async function checkAccountStatus(nanoTx) {
    logSubSection('Checking Account Status');
    
    try {
        logInfo('Querying account_info...');
        const accountInfo = await nanoTx.rpcCall('account_info', {
            account: ACCOUNT.address,
            representative: 'true',
            weight: 'true',
            pending: 'true'
        });

        if (accountInfo.error) {
            logWarning('Account not yet opened (no blocks received yet)');
            return { exists: false, info: null };
        }

        logSuccess('Account is opened and active');
        logInfo('Account Information:', {
            balance_raw: accountInfo.balance,
            balance_xno: NanoConverter.rawToXNO(accountInfo.balance),
            frontier: accountInfo.frontier,
            representative: accountInfo.representative,
            block_count: accountInfo.block_count
        });

        return { exists: true, info: accountInfo };
    } catch (error) {
        logError('Failed to check account status', error);
        throw error;
    }
}

/**
 * Get pending blocks for the account
 */
async function getPendingBlocks(nanoTx) {
    logSubSection('Fetching Pending Blocks');
    
    try {
        logInfo('Querying pending blocks...');
        const pendingResult = await nanoTx.rpcCall('pending', {
            account: ACCOUNT.address,
            count: '100',
            source: 'true',
            include_active: 'true',
            sorting: 'true',
            threshold: '1'
        });

        logDebug('Pending RPC response:', pendingResult);

        if (!pendingResult.blocks || Object.keys(pendingResult.blocks).length === 0) {
            logWarning('No pending blocks found');
            return [];
        }

        const pendingBlocks = Object.entries(pendingResult.blocks).map(([hash, info]) => ({
            hash,
            amount: info.amount,
            source: info.source
        }));

        logSuccess(`Found ${pendingBlocks.length} pending block(s)`);
        
        pendingBlocks.forEach((block, idx) => {
            const amountXNO = NanoConverter.rawToXNO(block.amount);
            logInfo(`  ${idx + 1}. Hash: ${block.hash}`);
            logInfo(`     Amount: ${block.amount} raw (${amountXNO} XNO)`);
            if (block.source) {
                logInfo(`     Source: ${block.source}`);
            }
        });

        return pendingBlocks;
    } catch (error) {
        logError('Failed to fetch pending blocks', error);
        throw error;
    }
}

/**
 * Process a single pending block
 */
async function processPendingBlock(nanoTx, pendingBlock, accountStatus, blockIndex, totalBlocks) {
    logSubSection(`Processing Block ${blockIndex + 1}/${totalBlocks}`);
    
    try {
        logInfo(`Block hash: ${pendingBlock.hash}`);
        logInfo(`Amount: ${pendingBlock.amount} raw (${NanoConverter.rawToXNO(pendingBlock.amount)} XNO)`);

        // Determine if this is a new account (first receive)
        const isNewAccount = !accountStatus.exists;
        logInfo(`Block type: ${isNewAccount ? 'OPEN (first receive)' : 'RECEIVE'}`);

        // Determine work hash
        const workHash = isNewAccount ? ACCOUNT.publicKey : accountStatus.info.frontier;
        logInfo(`Work hash: ${workHash}`);

        // Generate work
        logInfo('Generating Proof of Work...');
        const startTime = Date.now();
        const workResult = await nanoTx.generateWork(workHash);
        const workDuration = Date.now() - startTime;
        
        // The work result can be either a string or an object with a work property
        let workValue;
        if (typeof workResult === 'string') {
            workValue = workResult;
        } else if (workResult && workResult.work) {
            workValue = workResult.work;
        } else {
            throw new Error('Work generation failed - no work value returned');
        }
        
        logSuccess(`Work generated in ${workDuration}ms: ${workValue}`);

        // Determine representative
        const representative = isNewAccount ? 
            'nano_3qya5xpjfsbk3ndfebo9dsrj6iy6f6idmogqtn1mtzdtwnxu6rw3dz18i6xf' : 
            accountStatus.info.representative;
        logInfo(`Representative: ${representative}`);

        // Build block data
        const blockData = {
            walletBalanceRaw: isNewAccount ? '0' : accountStatus.info.balance,
            toAddress: ACCOUNT.address,
            representativeAddress: representative,
            frontier: isNewAccount ? '0'.repeat(64) : accountStatus.info.frontier,
            transactionHash: pendingBlock.hash,
            amountRaw: pendingBlock.amount,
            work: workValue
        };

        logDebug('Block data:', blockData);

        // Create and sign block
        logInfo('Creating and signing receive block...');
        const signedBlock = block.receive(blockData, ACCOUNT.privateKey);
        logDebug('Signed block:', signedBlock);

        // Broadcast block
        logInfo('Broadcasting block to network...');
        const processResult = await nanoTx.rpcCall('process', {
            json_block: 'true',
            subtype: isNewAccount ? 'open' : 'receive',
            block: signedBlock
        });

        logDebug('Process result:', processResult);

        if (!processResult.hash) {
            throw new Error(`Block processing failed: ${JSON.stringify(processResult)}`);
        }

        logSuccess(`Block processed successfully!`);
        logInfo(`Processed block hash: ${processResult.hash}`);

        return {
            success: true,
            hash: pendingBlock.hash,
            processedHash: processResult.hash,
            amount: pendingBlock.amount
        };

    } catch (error) {
        logError(`Failed to process block ${pendingBlock.hash}`, error);
        return {
            success: false,
            hash: pendingBlock.hash,
            error: error.message
        };
    }
}

/**
 * Receive all pending blocks
 */
async function receiveAllPendingBlocks(nanoTx, pendingBlocks, accountStatus) {
    logSubSection('Receiving All Pending Blocks');
    
    const results = {
        processed: [],
        failed: [],
        total: pendingBlocks.length,
        successful: 0,
        failedCount: 0
    };

    for (let i = 0; i < pendingBlocks.length; i++) {
        const result = await processPendingBlock(nanoTx, pendingBlocks[i], accountStatus, i, pendingBlocks.length);

        if (result.success) {
            results.processed.push(result);
            results.successful++;

            // Update account status for next iteration
            try {
                const updatedInfo = await nanoTx.rpcCall('account_info', {
                    account: ACCOUNT.address
                });
                accountStatus.exists = true;
                accountStatus.info = updatedInfo;
                logDebug('Account status updated for next iteration');
            } catch (error) {
                logWarning('Failed to update account status, continuing...');
            }

            // Small delay between blocks
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            results.failed.push(result);
            results.failedCount++;
        }
    }

    return results;
}

/**
 * Display final results
 */
async function displayResults(nanoTx, results) {
    logSection('FINAL RESULTS');
    
    logInfo(`Total pending blocks: ${results.total}`);
    logInfo(`Successfully received: ${results.successful}`);
    logInfo(`Failed: ${results.failedCount}`);

    if (results.successful > 0) {
        logSuccess('\nSuccessfully processed blocks:');
        let totalReceived = BigInt(0);
        results.processed.forEach((item, idx) => {
            totalReceived += BigInt(item.amount);
            logInfo(`  ${idx + 1}. Hash: ${item.hash}`);
            logInfo(`     Processed Hash: ${item.processedHash}`);
            logInfo(`     Amount: ${item.amount} raw (${NanoConverter.rawToXNO(item.amount)} XNO)`);
        });
        logSuccess(`Total received: ${totalReceived.toString()} raw (${NanoConverter.rawToXNO(totalReceived.toString())} XNO)`);
    }

    if (results.failedCount > 0) {
        logError('\nFailed blocks:');
        results.failed.forEach((item, idx) => {
            logError(`  ${idx + 1}. Hash: ${item.hash}`);
            logError(`     Error: ${item.error}`);
        });
    }

    // Get final account status
    logSubSection('Final Account Status');
    try {
        const finalAccountInfo = await nanoTx.rpcCall('account_info', {
            account: ACCOUNT.address
        });

        if (finalAccountInfo && !finalAccountInfo.error) {
            logSuccess('Account Information:');
            logInfo(`  Balance (raw): ${finalAccountInfo.balance}`);
            logInfo(`  Balance (XNO): ${NanoConverter.rawToXNO(finalAccountInfo.balance)}`);
            logInfo(`  Frontier: ${finalAccountInfo.frontier}`);
            logInfo(`  Representative: ${finalAccountInfo.representative}`);
            logInfo(`  Block count: ${finalAccountInfo.block_count}`);
        }
    } catch (error) {
        logError('Failed to fetch final account status', error);
    }
}

/**
 * Main execution function
 */
async function main() {
    const scriptStartTime = Date.now();
    
    logSection('NANO PENDING BLOCKS RECEIVER');
    logInfo('Account Address:', ACCOUNT.address);
    logInfo('Public Key:', ACCOUNT.publicKey);
    logInfo('RPC Node:', RPC_CONFIG.rpcNodes[0]);
    logInfo('Script Start Time:', new Date().toISOString());

    try {
        // Step 1: Validate credentials
        validateAccountCredentials();

        // Step 2: Initialize Nano Transactions
        logSubSection('Initializing Nano Transactions');
        const nanoTx = new NanoTransactions(RPC_CONFIG);
        logSuccess('NanoTransactions initialized');

        // Step 3: Check account status
        const accountStatus = await checkAccountStatus(nanoTx);

        // Step 4: Get pending blocks
        const pendingBlocks = await getPendingBlocks(nanoTx);

        if (pendingBlocks.length === 0) {
            logWarning('No pending blocks to process. Exiting.');
            logSection('SCRIPT COMPLETED');
            logInfo('Total execution time:', `${Date.now() - scriptStartTime}ms`);
            return;
        }

        // Step 5: Process all pending blocks
        const results = await receiveAllPendingBlocks(nanoTx, pendingBlocks, accountStatus);

        // Step 6: Display results
        await displayResults(nanoTx, results);

        // Final summary
        logSection('SCRIPT COMPLETED SUCCESSFULLY');
        logInfo('Total execution time:', `${Date.now() - scriptStartTime}ms`);
        logSuccess(`Successfully received ${results.successful} of ${results.total} pending blocks`);

        if (results.failedCount > 0) {
            logWarning(`${results.failedCount} blocks failed to process`);
            process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        logSection('SCRIPT FAILED');
        logError('Fatal error occurred', error);
        logInfo('Total execution time:', `${Date.now() - scriptStartTime}ms`);
        process.exit(1);
    }
}

// Execute main function
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { main };

