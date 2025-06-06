"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_js_1 = require("./logger.js");
var path_1 = require("path");
var url_1 = require("url");
var dotenv_1 = require("dotenv");
var nanocurrency_1 = require("nanocurrency");
// Load environment variables
dotenv_1.default.config();
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
function rpc(request) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log(request);
                    return [4 /*yield*/, fetch("http://".concat(process.env.PIPPIN_HOST, ":11338"), {
                            method: 'POST',
                            body: JSON.stringify(request)
                        })];
                case 1:
                    response = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    throw Error("RPC status ".concat(response.status, ": failed to parse JSON"));
                case 5:
                    if ('error' in data) {
                        console.error("Pippin gave us this error: ".concat(data['error']));
                        throw Error(data['error']);
                    }
                    if (!response.ok) {
                        throw Error("RPC status ".concat(response.status, ": ").concat(JSON.stringify(data, null, 4)));
                    }
                    console.log(data);
                    return [2 /*return*/, data];
            }
        });
    });
}
function balance(account) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rpc({
                        action: "account_balance",
                        account: account,
                        include_only_confirmed: false
                    })];
                case 1:
                    data = _a.sent();
                    if (!data || !data.balance || !data.receivable) {
                        throw Error("Failed to get balance.");
                    }
                    return [2 /*return*/, {
                            balance: (0, nanocurrency_1.convert)(data.balance, { from: nanocurrency_1.Unit.raw, to: nanocurrency_1.Unit.Nano }),
                            receivable: (0, nanocurrency_1.convert)(data.receivable, { from: nanocurrency_1.Unit.raw, to: nanocurrency_1.Unit.Nano }),
                        }];
            }
        });
    });
}
function createAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rpc({
                        action: 'account_create',
                        wallet: process.env.WALLET
                    })];
                case 1:
                    data = _a.sent();
                    if (!data || !data.account || !(0, nanocurrency_1.checkAddress)(data.account)) {
                        throw Error("Failed to create account.");
                    }
                    return [2 /*return*/, data.account];
            }
        });
    });
}
function send(destination, source, amount, id) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(0, nanocurrency_1.checkAddress)(destination) || !(0, nanocurrency_1.checkAddress)(source) || !(0, nanocurrency_1.checkAmount)(amount)) {
                        throw Error("Invalid parameters.");
                    }
                    return [4 /*yield*/, rpc(__assign({ action: "send", wallet: process.env.WALLET, source: source, destination: destination, amount: amount }, (id && { id: id })))];
                case 1:
                    data = _a.sent();
                    if (!data || !data.block || !(0, nanocurrency_1.checkHash)(data.block)) {
                        throw Error("Failed to send nano.");
                    }
                    console.log(data);
                    console.log("sent " + amount + " nano to " + destination);
                    return [2 /*return*/, data.block];
            }
        });
    });
}
function receive(account, blockHash) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(0, nanocurrency_1.checkAddress)(account) || !(0, nanocurrency_1.checkHash)(blockHash)) {
                        throw Error("Receive: invalid parameters.");
                    }
                    return [4 /*yield*/, rpc({
                            action: "receive",
                            wallet: process.env.WALLET,
                            account: account,
                            block: blockHash,
                        })];
                case 1:
                    data = _a.sent();
                    if (!data || !data.block || !(0, nanocurrency_1.checkHash)(data.block)) {
                        throw Error("Failed to receive nano");
                    }
                    return [2 /*return*/, data.block];
            }
        });
    });
}
function receive_all(account) {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(0, nanocurrency_1.checkAddress)(account)) {
                        throw Error("Receive: invalid parameters.");
                    }
                    return [4 /*yield*/, rpc({
                            action: "account_receive_all",
                            wallet: process.env.WALLET,
                            account: account,
                        })];
                case 1:
                    data = _a.sent();
                    if (!data) {
                        throw Error("Failed to receive all");
                    }
                    return [2 /*return*/, data];
            }
        });
    });
}
function testWalletTransfer() {
    return __awaiter(this, void 0, void 0, function () {
        var logger, wallet1Address, funded, startTime, timeoutMs, balanceInfo, error_1, wallet2Address, sendAmount, sendHash, sendBackHash, testResults, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger = new logger_js_1.Logger(path_1.default.join(__dirname, 'logs'));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 21, , 22]);
                    logger.log('TEST_START', 'Starting Wallet Transfer Test');
                    // Step 1: Create first wallet
                    logger.log('WALLET1_CREATE', 'Creating first wallet');
                    return [4 /*yield*/, createAccount()];
                case 2:
                    wallet1Address = _a.sent();
                    logger.log('WALLET1_CREATED', {
                        address: wallet1Address
                    });
                    console.log('\n=== WALLET 1 ADDRESS ===');
                    console.log('Please send exactly 0.00001 NANO to this address:');
                    console.log(wallet1Address);
                    console.log('Waiting for funds...');
                    // Step 2: Wait and check for incoming transaction
                    logger.log('WAITING_FOR_FUNDS', 'Waiting for incoming transaction');
                    funded = false;
                    startTime = Date.now();
                    timeoutMs = 300000;
                    _a.label = 3;
                case 3:
                    if (!(!funded && (Date.now() - startTime) < timeoutMs)) return [3 /*break*/, 13];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 10, , 12]);
                    return [4 /*yield*/, balance(wallet1Address)];
                case 5:
                    balanceInfo = _a.sent();
                    if (!(parseFloat(balanceInfo.balance) > 0 || parseFloat(balanceInfo.receivable) > 0)) return [3 /*break*/, 7];
                    logger.log('FUNDS_RECEIVED', {
                        account: wallet1Address,
                        balance: balanceInfo.balance,
                        receivable: balanceInfo.receivable
                    });
                    // Receive any pending funds
                    return [4 /*yield*/, receive_all(wallet1Address)];
                case 6:
                    // Receive any pending funds
                    _a.sent();
                    funded = true;
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, sleep(5000)];
                case 8:
                    _a.sent(); // Check every 5 seconds
                    process.stdout.write('.');
                    _a.label = 9;
                case 9: return [3 /*break*/, 12];
                case 10:
                    error_1 = _a.sent();
                    logger.logError('CHECK_BALANCE_ERROR', error_1);
                    return [4 /*yield*/, sleep(5000)];
                case 11:
                    _a.sent();
                    process.stdout.write('x');
                    return [3 /*break*/, 12];
                case 12: return [3 /*break*/, 3];
                case 13:
                    if (!funded) {
                        throw new Error('Timeout waiting for funds');
                    }
                    // Step 3: Create second wallet
                    logger.log('WALLET2_CREATE', 'Creating second wallet');
                    return [4 /*yield*/, createAccount()];
                case 14:
                    wallet2Address = _a.sent();
                    logger.log('WALLET2_CREATED', {
                        address: wallet2Address
                    });
                    // Step 4: Send to wallet2
                    logger.log('SENDING_TO_WALLET2', 'Sending funds from wallet 1 to wallet 2');
                    sendAmount = '0.00001';
                    return [4 /*yield*/, send(wallet2Address, wallet1Address, sendAmount)];
                case 15:
                    sendHash = _a.sent();
                    logger.log('SENT_TO_WALLET2', {
                        hash: sendHash,
                        from: wallet1Address,
                        to: wallet2Address,
                        amount: sendAmount
                    });
                    // Step 5: Receive in wallet2
                    logger.log('RECEIVING_IN_WALLET2', 'Receiving funds in wallet 2');
                    return [4 /*yield*/, sleep(5000)];
                case 16:
                    _a.sent(); // Wait for transaction to propagate
                    return [4 /*yield*/, receive_all(wallet2Address)];
                case 17:
                    _a.sent();
                    // Step 6: Send back to wallet1
                    logger.log('SENDING_BACK_TO_WALLET1', 'Sending funds back to wallet 1');
                    return [4 /*yield*/, send(wallet1Address, wallet2Address, sendAmount)];
                case 18:
                    sendBackHash = _a.sent();
                    logger.log('SENT_TO_WALLET1', {
                        hash: sendBackHash,
                        from: wallet2Address,
                        to: wallet1Address,
                        amount: sendAmount
                    });
                    // Step 7: Receive back in wallet1
                    logger.log('RECEIVING_BACK_IN_WALLET1', 'Receiving funds back in wallet 1');
                    return [4 /*yield*/, sleep(5000)];
                case 19:
                    _a.sent(); // Wait for transaction to propagate
                    return [4 /*yield*/, receive_all(wallet1Address)];
                case 20:
                    _a.sent();
                    testResults = {
                        total: 7,
                        passed: 7,
                        failed: 0,
                        duration: Date.now() - startTime,
                        wallet1: {
                            address: wallet1Address
                        },
                        wallet2: {
                            address: wallet2Address
                        }
                    };
                    logger.summarize(testResults);
                    logger.log('TEST_COMPLETE', 'Wallet Transfer Test completed successfully');
                    return [3 /*break*/, 22];
                case 21:
                    error_2 = _a.sent();
                    logger.logError('TEST_FAILURE', error_2);
                    throw error_2;
                case 22: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testWalletTransfer().catch(function (error) {
    console.error('Test failed:', error);
    process.exit(1);
});
