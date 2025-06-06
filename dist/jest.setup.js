import '@testing-library/jest-dom';
import { config } from '@chainreactionom/nano-mcp-server/dist/config/global';
beforeAll(async () => {
    await config.initializeConfig({
        rpcUrl: 'https://rpc.nano.to/',
        rpcKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
        gpuKey: 'RPC-KEY-BAB822FCCDAE42ECB7A331CCAAAA23',
        defaultRepresentative: 'nano_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4'
    });
});
