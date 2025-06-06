declare module 'nanocurrency-web' {
  export interface Account {
    address: string;
    privateKey: string;
    publicKey: string;
  }

  export interface Wallet {
    mnemonic: string;
    seed: string;
    accounts: Account[];
  }

  export const wallet: {
    generate: (entropy?: string, seedPassword?: string) => Promise<Wallet>;
  };

  export interface BlockData {
    walletBalanceRaw: string;
    fromAddress: string;
    toAddress: string;
    representativeAddress: string;
    frontier: string;
    amountRaw: string;
    work: string;
    transactionHash?: string;
  }

  export interface Block {
    send: (data: BlockData, privateKey: string) => string;
    receive: (data: BlockData, privateKey: string) => string;
  }

  export const block: Block;
} 