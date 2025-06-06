import type { Wallet, BlockData } from 'nanocurrency-web';

export const wallet = {
  generate: jest.fn().mockImplementation(async (): Promise<Wallet> => ({
    mnemonic: 'test mnemonic',
    seed: 'test seed',
    accounts: [{
      address: 'nano_1234',
      privateKey: '1234',
      publicKey: '5678'
    }]
  }))
};

export const block = {
  send: jest.fn().mockImplementation((data: BlockData, privateKey: string): string => 'mocked_signed_block'),
  receive: jest.fn().mockImplementation((data: BlockData, privateKey: string): string => 'mocked_signed_block')
}; 