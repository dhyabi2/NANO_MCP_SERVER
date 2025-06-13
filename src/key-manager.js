const { NanoTransactions } = require('../utils/nano-transactions');

class KeyManager {
    constructor(config) {
        this.nanoTransactions = new NanoTransactions({}, config);
    }

    async generateKeyPair() {
        const wallet = await this.nanoTransactions.generateWallet();
        return {
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey,
            address: wallet.address
        };
    }
}

module.exports = { KeyManager }; 