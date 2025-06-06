"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nano = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const nanocurrency_1 = require("nanocurrency");
class Nano {
    description = {
        displayName: 'Nano',
        name: 'nano',
        icon: 'file:nano.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: 'Interact with Nano (XNO) cryptocurrency via RPC',
        defaults: {
            name: 'Nano',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'nanoApi',
                required: false,
                displayOptions: {
                    show: {
                        authentication: ['credentials'],
                    },
                },
            },
        ],
        properties: [
            {
                displayName: 'Authentication',
                name: 'authentication',
                type: 'options',
                options: [
                    {
                        name: 'Public Node (SomeNano)',
                        value: 'public',
                        description: 'Use the public SomeNano RPC endpoint',
                    },
                    {
                        name: 'Custom Node',
                        value: 'credentials',
                        description: 'Use your own Nano node with credentials',
                    },
                ],
                default: 'public',
                description: 'How to authenticate with the Nano RPC',
            },
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Account',
                        value: 'account',
                    },
                    {
                        name: 'Block',
                        value: 'block',
                    },
                    {
                        name: 'Network',
                        value: 'network',
                    },
                    {
                        name: 'Utility',
                        value: 'utility',
                    },
                ],
                default: 'account',
            },
            // Account Operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['account'],
                    },
                },
                options: [
                    {
                        name: 'Get Balance',
                        value: 'getBalance',
                        description: 'Get account balance',
                        action: 'Get account balance',
                    },
                    {
                        name: 'Get Info',
                        value: 'getInfo',
                        description: 'Get account information',
                        action: 'Get account info',
                    },
                    {
                        name: 'Get History',
                        value: 'getHistory',
                        description: 'Get account transaction history',
                        action: 'Get account history',
                    },
                    {
                        name: 'Get Pending',
                        value: 'getPending',
                        description: 'Get pending transactions',
                        action: 'Get pending transactions',
                    },
                    {
                        name: 'Validate',
                        value: 'validate',
                        description: 'Validate account number',
                        action: 'Validate account',
                    },
                ],
                default: 'getBalance',
            },
            // Block Operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['block'],
                    },
                },
                options: [
                    {
                        name: 'Get Info',
                        value: 'getBlockInfo',
                        description: 'Get block information',
                        action: 'Get block info',
                    },
                    {
                        name: 'Get Account',
                        value: 'getBlockAccount',
                        description: 'Get account that owns a block',
                        action: 'Get block account',
                    },
                    {
                        name: 'Get Count',
                        value: 'getBlockCount',
                        description: 'Get block count',
                        action: 'Get block count',
                    },
                ],
                default: 'getBlockInfo',
            },
            // Network Operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['network'],
                    },
                },
                options: [
                    {
                        name: 'Get Representatives',
                        value: 'getRepresentatives',
                        description: 'Get list of representatives',
                        action: 'Get representatives',
                    },
                    {
                        name: 'Get Online Representatives',
                        value: 'getOnlineRepresentatives',
                        description: 'Get online representatives',
                        action: 'Get online representatives',
                    },
                    {
                        name: 'Get Difficulty',
                        value: 'getDifficulty',
                        description: 'Get current network difficulty',
                        action: 'Get network difficulty',
                    },
                    {
                        name: 'Get Supply',
                        value: 'getSupply',
                        description: 'Get available supply',
                        action: 'Get available supply',
                    },
                    {
                        name: 'Get Version',
                        value: 'getVersion',
                        description: 'Get node version',
                        action: 'Get node version',
                    },
                ],
                default: 'getVersion',
            },
            // Utility Operations
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['utility'],
                    },
                },
                options: [
                    {
                        name: 'Convert Units',
                        value: 'convertUnits',
                        description: 'Convert between Nano units',
                        action: 'Convert units',
                    },
                    {
                        name: 'Get Price',
                        value: 'getPrice',
                        description: 'Get current Nano price',
                        action: 'Get Nano price',
                    },
                    {
                        name: 'Generate Key',
                        value: 'generateKey',
                        description: 'Generate a new private key',
                        action: 'Generate key',
                    },
                ],
                default: 'convertUnits',
            },
            // Account fields
            {
                displayName: 'Account',
                name: 'account',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['getBalance', 'getInfo', 'getHistory', 'getPending', 'validate'],
                    },
                },
                placeholder: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                description: 'The Nano account address',
            },
            // Block fields
            {
                displayName: 'Block Hash',
                name: 'blockHash',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['block'],
                        operation: ['getBlockInfo', 'getBlockAccount'],
                    },
                },
                description: 'The block hash',
            },
            // History options
            {
                displayName: 'Count',
                name: 'count',
                type: 'number',
                default: 10,
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['getHistory'],
                    },
                },
                description: 'Number of history entries to return',
            },
            // Pending options
            {
                displayName: 'Count',
                name: 'pendingCount',
                type: 'number',
                default: 10,
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['getPending'],
                    },
                },
                description: 'Maximum number of pending blocks to return',
            },
            {
                displayName: 'Threshold',
                name: 'threshold',
                type: 'string',
                default: '0',
                displayOptions: {
                    show: {
                        resource: ['account'],
                        operation: ['getPending'],
                    },
                },
                description: 'Minimum amount in raw for pending blocks',
            },
            // Unit conversion fields
            {
                displayName: 'Amount',
                name: 'amount',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['utility'],
                        operation: ['convertUnits'],
                    },
                },
                description: 'Amount to convert',
            },
            {
                displayName: 'From Unit',
                name: 'fromUnit',
                type: 'options',
                options: [
                    { name: 'Raw', value: 'raw' },
                    { name: 'Nano', value: 'Nano' },
                    { name: 'NANO', value: 'NANO' },
                    { name: 'Mnano', value: 'Mnano' },
                    { name: 'knano', value: 'knano' },
                ],
                default: 'Nano',
                displayOptions: {
                    show: {
                        resource: ['utility'],
                        operation: ['convertUnits'],
                    },
                },
            },
            {
                displayName: 'To Unit',
                name: 'toUnit',
                type: 'options',
                options: [
                    { name: 'Raw', value: 'raw' },
                    { name: 'Nano', value: 'Nano' },
                    { name: 'NANO', value: 'NANO' },
                    { name: 'Mnano', value: 'Mnano' },
                    { name: 'knano', value: 'knano' },
                ],
                default: 'raw',
                displayOptions: {
                    show: {
                        resource: ['utility'],
                        operation: ['convertUnits'],
                    },
                },
            },
        ],
    };
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const authentication = this.getNodeParameter('authentication', 0);
        const resource = this.getNodeParameter('resource', 0);
        const operation = this.getNodeParameter('operation', 0);
        let rpcUrl = 'https://node.somenano.com/proxy';
        if (authentication === 'credentials') {
            const credentials = await this.getCredentials('nanoApi');
            if (credentials.nodeUrl) {
                rpcUrl = credentials.nodeUrl;
            }
        }
        for (let i = 0; i < items.length; i++) {
            try {
                let responseData;
                if (resource === 'account') {
                    if (operation === 'getBalance') {
                        const account = this.getNodeParameter('account', i);
                        if (!(0, nanocurrency_1.checkAddress)(account)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid Nano account address');
                        }
                        const rpcData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'account_balance',
                                account,
                            },
                            json: true,
                        });
                        responseData = {
                            account,
                            balance: (0, nanocurrency_1.convert)(rpcData.balance, { from: nanocurrency_1.Unit.raw, to: nanocurrency_1.Unit.Nano }),
                            pending: (0, nanocurrency_1.convert)(rpcData.pending || rpcData.receivable || '0', { from: nanocurrency_1.Unit.raw, to: nanocurrency_1.Unit.Nano }),
                            balance_raw: rpcData.balance,
                            pending_raw: rpcData.pending || rpcData.receivable || '0',
                        };
                    }
                    else if (operation === 'getInfo') {
                        const account = this.getNodeParameter('account', i);
                        if (!(0, nanocurrency_1.checkAddress)(account)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid Nano account address');
                        }
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'account_info',
                                account,
                                representative: true,
                                weight: true,
                                pending: true,
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getHistory') {
                        const account = this.getNodeParameter('account', i);
                        const count = this.getNodeParameter('count', i);
                        if (!(0, nanocurrency_1.checkAddress)(account)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid Nano account address');
                        }
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'account_history',
                                account,
                                count,
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getPending') {
                        const account = this.getNodeParameter('account', i);
                        const count = this.getNodeParameter('pendingCount', i);
                        const threshold = this.getNodeParameter('threshold', i);
                        if (!(0, nanocurrency_1.checkAddress)(account)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid Nano account address');
                        }
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'pending',
                                account,
                                count,
                                threshold,
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'validate') {
                        const account = this.getNodeParameter('account', i);
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'validate_account_number',
                                account,
                            },
                            json: true,
                        });
                    }
                }
                else if (resource === 'block') {
                    if (operation === 'getBlockInfo') {
                        const blockHash = this.getNodeParameter('blockHash', i);
                        if (!(0, nanocurrency_1.checkHash)(blockHash)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid block hash');
                        }
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'block_info',
                                hash: blockHash,
                                json_block: true,
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getBlockAccount') {
                        const blockHash = this.getNodeParameter('blockHash', i);
                        if (!(0, nanocurrency_1.checkHash)(blockHash)) {
                            throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Invalid block hash');
                        }
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'block_account',
                                hash: blockHash,
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getBlockCount') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'block_count',
                            },
                            json: true,
                        });
                    }
                }
                else if (resource === 'network') {
                    if (operation === 'getRepresentatives') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'representatives',
                                count: 100,
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getOnlineRepresentatives') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'representatives_online',
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getDifficulty') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'active_difficulty',
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getSupply') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'available_supply',
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'getVersion') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'version',
                            },
                            json: true,
                        });
                    }
                }
                else if (resource === 'utility') {
                    if (operation === 'convertUnits') {
                        const amount = this.getNodeParameter('amount', i);
                        const fromUnit = this.getNodeParameter('fromUnit', i);
                        const toUnit = this.getNodeParameter('toUnit', i);
                        const converted = (0, nanocurrency_1.convert)(amount, {
                            from: nanocurrency_1.Unit[fromUnit],
                            to: nanocurrency_1.Unit[toUnit],
                        });
                        responseData = {
                            input: amount,
                            fromUnit,
                            toUnit,
                            result: converted,
                        };
                    }
                    else if (operation === 'getPrice') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'price',
                            },
                            json: true,
                        });
                    }
                    else if (operation === 'generateKey') {
                        responseData = await this.helpers.request({
                            method: 'POST',
                            uri: rpcUrl,
                            body: {
                                action: 'key_create',
                            },
                            json: true,
                        });
                    }
                }
                returnData.push({ json: responseData });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Nano = Nano;
