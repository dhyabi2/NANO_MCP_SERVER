import { IExecuteFunctions } from 'n8n-workflow';
import { Nano } from '../Nano.node';

// Mock the n8n helpers
const mockHelpers = {
	request: jest.fn(),
};

const mockExecuteFunctions: Partial<IExecuteFunctions> = {
	getInputData: jest.fn().mockReturnValue([{ json: {} }]),
	getNodeParameter: jest.fn(),
	getCredentials: jest.fn(),
	getNode: jest.fn().mockReturnValue({}),
	continueOnFail: jest.fn().mockReturnValue(false),
	helpers: mockHelpers as any,
};

describe('Nano Node', () => {
	let nano: Nano;

	beforeEach(() => {
		nano = new Nano();
		jest.clearAllMocks();
	});

	describe('Account Operations', () => {
		it('should get account balance', async () => {
			const mockAccount = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
			const mockBalance = {
				balance: '100000000000000000000000000000',
				pending: '0',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('account') // resource
				.mockReturnValueOnce('getBalance') // operation
				.mockReturnValueOnce(mockAccount); // account

			mockHelpers.request.mockResolvedValueOnce(mockBalance);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'account_balance',
					account: mockAccount,
				},
				json: true,
			});

			expect(result[0][0].json).toHaveProperty('balance');
			expect(result[0][0].json).toHaveProperty('balance_raw', mockBalance.balance);
		});

		it('should get account info', async () => {
			const mockAccount = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
			const mockInfo = {
				frontier: 'FF84533A571D953A596EA401FD41743AC85D04F406E76FDE4408EAED50B473C5',
				open_block: '991CF190094C00F0B68E2E5F75F6BEE95A2E0BD93CEAA4A6734DB9F19B728948',
				representative_block: '991CF190094C00F0B68E2E5F75F6BEE95A2E0BD93CEAA4A6734DB9F19B728948',
				balance: '235580100176034320859259343606608761791',
				modified_timestamp: '1501793775',
				block_count: '33',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('account') // resource
				.mockReturnValueOnce('getInfo') // operation
				.mockReturnValueOnce(mockAccount); // account

			mockHelpers.request.mockResolvedValueOnce(mockInfo);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'account_info',
					account: mockAccount,
					representative: true,
					weight: true,
					pending: true,
				},
				json: true,
			});

			expect(result[0][0].json).toEqual(mockInfo);
		});

		it('should validate account', async () => {
			const mockAccount = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';
			const mockValidation = {
				valid: '1',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('account') // resource
				.mockReturnValueOnce('validate') // operation
				.mockReturnValueOnce(mockAccount); // account

			mockHelpers.request.mockResolvedValueOnce(mockValidation);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'validate_account_number',
					account: mockAccount,
				},
				json: true,
			});

			expect(result[0][0].json).toEqual(mockValidation);
		});
	});

	describe('Block Operations', () => {
		it('should get block info', async () => {
			const mockHash = '87434F8041869A01C8F6F263B87972D7BA443A72E0A97D7A3FD0CCC2358FD6F9';
			const mockBlockInfo = {
				block_account: 'nano_1ipx847tk8o46pwxt5qjdbncjqcbwcc1rrmqnkztrfjy5k7z4imsrata9est',
				amount: '30000000000000000000000000000000000',
				balance: '5606157000000000000000000000000000000',
				height: '58',
				local_timestamp: '0',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('block') // resource
				.mockReturnValueOnce('getBlockInfo') // operation
				.mockReturnValueOnce(mockHash); // blockHash

			mockHelpers.request.mockResolvedValueOnce(mockBlockInfo);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'block_info',
					hash: mockHash,
					json_block: true,
				},
				json: true,
			});

			expect(result[0][0].json).toEqual(mockBlockInfo);
		});
	});

	describe('Network Operations', () => {
		it('should get node version', async () => {
			const mockVersion = {
				rpc_version: '1',
				store_version: '14',
				protocol_version: '18',
				node_vendor: 'Nano 21.0',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('network') // resource
				.mockReturnValueOnce('getVersion'); // operation

			mockHelpers.request.mockResolvedValueOnce(mockVersion);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'version',
				},
				json: true,
			});

			expect(result[0][0].json).toEqual(mockVersion);
		});

		it('should get available supply', async () => {
			const mockSupply = {
				available: '133248061996216572282917317807824970865',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('network') // resource
				.mockReturnValueOnce('getSupply'); // operation

			mockHelpers.request.mockResolvedValueOnce(mockSupply);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'available_supply',
				},
				json: true,
			});

			expect(result[0][0].json).toEqual(mockSupply);
		});
	});

	describe('Utility Operations', () => {
		it('should convert units', async () => {
			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('utility') // resource
				.mockReturnValueOnce('convertUnits') // operation
				.mockReturnValueOnce('1') // amount
				.mockReturnValueOnce('Nano') // fromUnit
				.mockReturnValueOnce('raw'); // toUnit

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result[0][0].json).toEqual({
				input: '1',
				fromUnit: 'Nano',
				toUnit: 'raw',
				result: '1000000000000000000000000000000',
			});
		});

		it('should get price', async () => {
			const mockPrice = {
				currency: 'USD',
				price: '5.45',
			};

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('utility') // resource
				.mockReturnValueOnce('getPrice'); // operation

			mockHelpers.request.mockResolvedValueOnce(mockPrice);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: 'https://node.somenano.com/proxy',
				body: {
					action: 'price',
				},
				json: true,
			});

			expect(result[0][0].json).toEqual(mockPrice);
		});
	});

	describe('Custom Node Authentication', () => {
		it('should use custom node URL from credentials', async () => {
			const customUrl = 'http://my-nano-node:7076';
			const mockAccount = 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3';

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('credentials') // authentication
				.mockReturnValueOnce('account') // resource
				.mockReturnValueOnce('getBalance') // operation
				.mockReturnValueOnce(mockAccount); // account

			mockExecuteFunctions.getCredentials = jest.fn().mockResolvedValueOnce({
				nodeUrl: customUrl,
			});

			mockHelpers.request.mockResolvedValueOnce({
				balance: '100000000000000000000000000000',
				pending: '0',
			});

			await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockHelpers.request).toHaveBeenCalledWith({
				method: 'POST',
				uri: customUrl,
				body: {
					action: 'account_balance',
					account: mockAccount,
				},
				json: true,
			});
		});
	});

	describe('Error Handling', () => {
		it('should throw error for invalid account address', async () => {
			const invalidAccount = 'invalid_account';

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('account') // resource
				.mockReturnValueOnce('getBalance') // operation
				.mockReturnValueOnce(invalidAccount); // account

			await expect(nano.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow('Invalid Nano account address');
		});

		it('should throw error for invalid block hash', async () => {
			const invalidHash = 'invalid_hash';

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('block') // resource
				.mockReturnValueOnce('getBlockInfo') // operation
				.mockReturnValueOnce(invalidHash); // blockHash

			await expect(nano.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow('Invalid block hash');
		});

		it('should continue on fail when enabled', async () => {
			const invalidAccount = 'invalid_account';

			mockExecuteFunctions.getNodeParameter = jest.fn()
				.mockReturnValueOnce('public') // authentication
				.mockReturnValueOnce('account') // resource
				.mockReturnValueOnce('getBalance') // operation
				.mockReturnValueOnce(invalidAccount); // account

			mockExecuteFunctions.continueOnFail = jest.fn().mockReturnValue(true);

			const result = await nano.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result[0][0].json).toHaveProperty('error');
			expect(result[0][0].json.error).toBe('Invalid Nano account address');
		});
	});
}); 