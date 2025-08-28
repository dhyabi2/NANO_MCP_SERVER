const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pendingReceiveService = require('../services/pending-receive.service');
const config = require('../config/pending-receive.config');
const { SchemaValidator } = require('../utils/schema-validator');

// Create rate limiter
const limiter = rateLimit(config.rateLimit);

// Schema validator
const schemaValidator = SchemaValidator.getInstance();

// Apply rate limiter to all routes
router.use(limiter);

/**
 * @swagger
 * /pending-receive/blocks:
 *   get:
 *     summary: Get pending blocks for an account
 *     parameters:
 *       - in: query
 *         name: account
 *         required: true
 *         schema:
 *           type: string
 *         description: The nano account address
 *     responses:
 *       200:
 *         description: List of pending blocks
 *       400:
 *         description: Invalid parameters
 *       429:
 *         description: Too many requests
 */
router.get('/blocks', async (req, res) => {
    try {
        schemaValidator.validate(req.query, {
            type: 'object',
            required: ['account'],
            properties: {
                account: { type: 'string' }
            }
        });

        const result = await pendingReceiveService.getPendingBlocks(req.query.account);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

/**
 * @swagger
 * /pending-receive/process:
 *   post:
 *     summary: Process a specific pending block
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - privateKey
 *               - blockHash
 *               - amount
 *             properties:
 *               account:
 *                 type: string
 *               privateKey:
 *                 type: string
 *               blockHash:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Block processed successfully
 *       400:
 *         description: Invalid parameters
 *       429:
 *         description: Too many requests
 */
router.post('/process', async (req, res) => {
    try {
        schemaValidator.validate(req.body, {
            type: 'object',
            required: ['account', 'privateKey', 'blockHash', 'amount'],
            properties: {
                account: { type: 'string' },
                privateKey: { type: 'string' },
                blockHash: { type: 'string' },
                amount: { type: 'string' }
            }
        });

        const accountInfo = await pendingReceiveService.getAccountInfo(req.body.account);
        const result = await pendingReceiveService.processPendingBlock(
            req.body.account,
            req.body.privateKey,
            req.body.blockHash,
            req.body.amount,
            accountInfo
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

/**
 * @swagger
 * /pending-receive/receive-all:
 *   post:
 *     summary: Receive all pending blocks for an account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - privateKey
 *             properties:
 *               account:
 *                 type: string
 *               privateKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: All pending blocks processed
 *       400:
 *         description: Invalid parameters
 *       429:
 *         description: Too many requests
 */
router.post('/receive-all', async (req, res) => {
    try {
        schemaValidator.validate(req.body, {
            type: 'object',
            required: ['account', 'privateKey'],
            properties: {
                account: { type: 'string' },
                privateKey: { type: 'string' }
            }
        });

        const result = await pendingReceiveService.receiveAllPending(
            req.body.account,
            req.body.privateKey
        );

        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

module.exports = router;
