const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nano MCP API',
      version: '1.2.16',
      description: 'JSON-RPC 2.0 API for Nano cryptocurrency operations',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Local development server',
      },
    ],
    components: {
      schemas: {
        JsonRpcError: {
          type: 'object',
          required: ['jsonrpc', 'error', 'id'],
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'number',
                  description: 'Error code',
                  example: -32603,
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                  example: 'Internal error',
                },
              },
            },
            id: {
              type: ['number', 'string', 'null'],
              description: 'Request identifier that generated the error',
            },
          },
        },
        JsonRpcRequest: {
          type: 'object',
          required: ['jsonrpc', 'method', 'id'],
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            method: {
              type: 'string',
              description: 'The method to call',
            },
            params: {
              type: 'object',
              description: 'Method parameters',
            },
            id: {
              type: ['number', 'string'],
              description: 'Request identifier',
            },
          },
        },
        JsonRpcResponse: {
          type: 'object',
          required: ['jsonrpc', 'id'],
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            result: {
              type: 'object',
              description: 'Response result',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'number',
                  description: 'Error code',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                },
              },
            },
            id: {
              type: ['number', 'string', 'null'],
              description: 'Request identifier',
            },
          },
        },
        InitializeResponse: {
          type: 'object',
          properties: {
            version: {
              type: 'string',
              example: '1.0.0',
            },
            capabilities: {
              type: 'object',
              properties: {
                methods: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['initialize', 'generateWallet', 'getBalance', 'initializeAccount', 'sendTransaction', 'receiveAllPending'],
                },
              },
            },
          },
        },
        WalletResponse: {
          type: 'object',
          properties: {
            publicKey: {
              type: 'string',
              description: 'Public key of the wallet',
            },
            privateKey: {
              type: 'string',
              description: 'Private key of the wallet',
            },
            address: {
              type: 'string',
              description: 'Nano address',
            },
          },
        },
        BalanceResponse: {
          type: 'object',
          properties: {
            balance: {
              type: 'string',
              description: 'Account balance in raw units',
            },
            pending: {
              type: 'string',
              description: 'Pending balance in raw units',
            },
          },
        },
        AccountInfoResponse: {
          type: 'object',
          properties: {
            initialized: {
              type: 'boolean',
              description: 'Whether the account is initialized',
            },
            representative: {
              type: 'string',
              description: 'Account representative',
            },
          },
        },
        TransactionResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Transaction success status',
            },
            hash: {
              type: 'string',
              description: 'Transaction hash',
            },
            amount: {
              type: 'string',
              description: 'Transaction amount in raw units',
            },
            balance: {
              type: 'string',
              description: 'Account balance after transaction',
            },
          },
        },
        ReceiveAllPendingResponse: {
          type: 'object',
          properties: {
            received: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  hash: {
                    type: 'string',
                    description: 'Block hash',
                  },
                  amount: {
                    type: 'string',
                    description: 'Amount received in raw units',
                  },
                  source: {
                    type: 'string',
                    description: 'Source address',
                  },
                },
              },
            },
          },
        },
        GetAccountInfoRequest: {
          type: 'object',
          required: ['jsonrpc', 'method', 'params', 'id'],
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            method: {
              type: 'string',
              enum: ['getAccountInfo'],
              description: 'Method name',
            },
            params: {
              type: 'object',
              required: ['address'],
              properties: {
                address: {
                  type: 'string',
                  description: 'The Nano account address',
                },
              },
            },
            id: {
              type: 'number',
              description: 'Request identifier',
            },
          },
        },
        GetAccountInfoResponse: {
          type: 'object',
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            result: {
              type: 'object',
              properties: {
                frontier: {
                  type: 'string',
                  description: 'The latest block hash for the account',
                },
                open_block: {
                  type: 'string',
                  description: 'The first block hash for the account',
                },
                representative_block: {
                  type: 'string',
                  description: 'The representative block hash',
                },
                balance: {
                  type: 'string',
                  description: 'The account balance in raw',
                },
                modified_timestamp: {
                  type: 'string',
                  description: 'Last modified timestamp',
                },
                block_count: {
                  type: 'string',
                  description: 'Number of blocks in the account chain',
                },
                representative: {
                  type: 'string',
                  description: 'The account\'s representative',
                },
              },
            },
            id: {
              type: 'number',
              description: 'Request identifier',
            },
          },
        },
        GetPendingBlocksRequest: {
          type: 'object',
          required: ['jsonrpc', 'method', 'params', 'id'],
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            method: {
              type: 'string',
              enum: ['getPendingBlocks'],
              description: 'Method name',
            },
            params: {
              type: 'object',
              required: ['address'],
              properties: {
                address: {
                  type: 'string',
                  description: 'The Nano account address',
                },
              },
            },
            id: {
              type: 'number',
              description: 'Request identifier',
            },
          },
        },
        GetPendingBlocksResponse: {
          type: 'object',
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            result: {
              type: 'object',
              properties: {
                blocks: {
                  type: 'object',
                  additionalProperties: {
                    type: 'object',
                    properties: {
                      amount: {
                        type: 'string',
                        description: 'Amount in raw',
                      },
                      source: {
                        type: 'string',
                        description: 'Source account address',
                      },
                    },
                  },
                },
              },
            },
            id: {
              type: 'number',
              description: 'Request identifier',
            },
          },
        },
        GenerateWorkRequest: {
          type: 'object',
          required: ['jsonrpc', 'method', 'params', 'id'],
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            method: {
              type: 'string',
              enum: ['generateWork'],
              description: 'Method name',
            },
            params: {
              type: 'object',
              required: ['hash', 'isOpen'],
              properties: {
                hash: {
                  type: 'string',
                  description: 'The hash to generate work for',
                },
                isOpen: {
                  type: 'boolean',
                  description: 'Whether this is for an open block (lower difficulty)',
                  default: false,
                },
              },
            },
            id: {
              type: 'number',
              description: 'Request identifier',
            },
          },
        },
        GenerateWorkResponse: {
          type: 'object',
          properties: {
            jsonrpc: {
              type: 'string',
              enum: ['2.0'],
              description: 'JSON-RPC version',
            },
            result: {
              type: 'object',
              properties: {
                work: {
                  type: 'string',
                  description: 'The generated work value',
                },
              },
            },
            id: {
              type: 'number',
              description: 'Request identifier',
            },
          },
        },
      },
      requestBodies: {
        Initialize: {
          description: 'Initialize request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0'],
                    description: 'JSON-RPC version'
                  },
                  method: {
                    type: 'string',
                    enum: ['initialize'],
                    description: 'Method name'
                  },
                  params: {
                    type: 'object',
                    description: 'No parameters required'
                  },
                  id: {
                    type: 'number',
                    description: 'Request identifier'
                  }
                }
              },
              example: {
                jsonrpc: '2.0',
                method: 'initialize',
                params: {},
                id: 1
              }
            }
          }
        },
        GenerateWallet: {
          description: 'Generate a new Nano wallet',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0']
                  },
                  method: {
                    type: 'string',
                    enum: ['generateWallet']
                  },
                  params: {
                    type: 'object',
                    description: 'No parameters required'
                  },
                  id: {
                    type: 'number'
                  }
                }
              },
              example: {
                jsonrpc: '2.0',
                method: 'generateWallet',
                params: {},
                id: 1
              }
            }
          }
        },
        GetBalance: {
          description: 'Get account balance',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'params', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0']
                  },
                  method: {
                    type: 'string',
                    enum: ['getBalance']
                  },
                  params: {
                    type: 'object',
                    required: ['address'],
                    properties: {
                      address: {
                        type: 'string',
                        description: 'Nano address'
                      }
                    }
                  },
                  id: {
                    type: 'number'
                  }
                }
              },
              example: {
                jsonrpc: '2.0',
                method: 'getBalance',
                params: {
                  address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                },
                id: 1
              }
            }
          }
        },
        InitializeAccount: {
          description: 'Initialize a Nano account',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'params', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0']
                  },
                  method: {
                    type: 'string',
                    enum: ['initializeAccount']
                  },
                  params: {
                    type: 'object',
                    required: ['address', 'privateKey'],
                    properties: {
                      address: {
                        type: 'string',
                        description: 'Nano address'
                      },
                      privateKey: {
                        type: 'string',
                        description: 'Private key'
                      }
                    }
                  },
                  id: {
                    type: 'number'
                  }
                }
              },
              example: {
                jsonrpc: '2.0',
                method: 'initializeAccount',
                params: {
                  address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                  privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3'
                },
                id: 1
              }
            }
          }
        },
        SendTransaction: {
          description: 'Send Nano to another address',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'params', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0']
                  },
                  method: {
                    type: 'string',
                    enum: ['sendTransaction']
                  },
                  params: {
                    type: 'object',
                    required: ['fromAddress', 'privateKey', 'toAddress', 'amountRaw'],
                    properties: {
                      fromAddress: {
                        type: 'string',
                        description: 'Sender Nano address'
                      },
                      privateKey: {
                        type: 'string',
                        description: 'Sender private key'
                      },
                      toAddress: {
                        type: 'string',
                        description: 'Recipient Nano address'
                      },
                      amountRaw: {
                        type: 'string',
                        description: 'Amount in raw units'
                      }
                    }
                  },
                  id: {
                    type: 'number'
                  }
                }
              },
              example: {
                jsonrpc: '2.0',
                method: 'sendTransaction',
                params: {
                  fromAddress: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                  privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3',
                  toAddress: 'nano_1ipx847tk8o46pwxt5qjdbncjqcbwcc1rrmqnkztrfjy5k7z4imsrata9est',
                  amountRaw: '1000000000000000000000000000'
                },
                id: 1
              }
            }
          }
        },
        ReceiveAllPending: {
          description: 'Receive all pending transactions and update account balance. Funds will be actually received, not just marked as receivable.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'params', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0']
                  },
                  method: {
                    type: 'string',
                    enum: ['receiveAllPending']
                  },
                  params: {
                    type: 'object',
                    required: ['address', 'privateKey'],
                    properties: {
                      address: {
                        type: 'string',
                        description: 'Nano address'
                      },
                      privateKey: {
                        type: 'string',
                        description: 'Private key'
                      }
                    }
                  },
                  id: {
                    type: 'number'
                  }
                }
              },
              example: {
                jsonrpc: '2.0',
                method: 'receiveAllPending',
                params: {
                  address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                  privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3'
                },
                id: 1
              }
            }
          }
        }
      }
    },
    paths: {
      '/': {
        post: {
          summary: 'JSON-RPC 2.0 API endpoint',
          description: 'Handles all MCP Server operations via JSON-RPC 2.0 protocol',
          tags: ['Nano Operations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/InitializeRequest' },
                    { $ref: '#/components/schemas/GenerateWalletRequest' },
                    { $ref: '#/components/schemas/GetBalanceRequest' },
                    { $ref: '#/components/schemas/InitializeAccountRequest' },
                    { $ref: '#/components/schemas/SendTransactionRequest' },
                    { $ref: '#/components/schemas/ReceiveAllPendingRequest' },
                    { $ref: '#/components/schemas/GetAccountInfoRequest' },
                    { $ref: '#/components/schemas/GetPendingBlocksRequest' },
                    { $ref: '#/components/schemas/GenerateWorkRequest' }
                  ]
                },
                examples: {
                  initialize: {
                    summary: 'Initialize request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'initialize',
                      params: {},
                      id: 1
                    }
                  },
                  generateWallet: {
                    summary: 'Generate wallet request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'generateWallet',
                      params: {},
                      id: 1
                    }
                  },
                  getBalance: {
                    summary: 'Get balance request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'getBalance',
                      params: {
                        address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                      },
                      id: 1
                    }
                  },
                  initializeAccount: {
                    summary: 'Initialize account request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'initializeAccount',
                      params: {
                        address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                        privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3'
                      },
                      id: 1
                    }
                  },
                  sendTransaction: {
                    summary: 'Send transaction request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'sendTransaction',
                      params: {
                        fromAddress: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                        privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3',
                        toAddress: 'nano_1ipx847tk8o46pwxt5qjdbncjqcbwcc1rrmqnkztrfjy5k7z4imsrata9est',
                        amountRaw: '1000000000000000000000000000'
                      },
                      id: 1
                    }
                  },
                  receiveAllPending: {
                    summary: 'Receive all pending request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'receiveAllPending',
                      params: {
                        address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3',
                        privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3'
                      },
                      id: 1
                    }
                  },
                  getAccountInfo: {
                    summary: 'Get account info request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'getAccountInfo',
                      params: {
                        address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                      },
                      id: 1
                    }
                  },
                  getPendingBlocks: {
                    summary: 'Get pending blocks request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'getPendingBlocks',
                      params: {
                        address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                      },
                      id: 1
                    }
                  },
                  generateWork: {
                    summary: 'Generate work request',
                    value: {
                      jsonrpc: '2.0',
                      method: 'generateWork',
                      params: {
                        hash: '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F',
                        isOpen: false
                      },
                      id: 1
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/InitializeResponse' },
                      { $ref: '#/components/schemas/GenerateWalletResponse' },
                      { $ref: '#/components/schemas/GetBalanceResponse' },
                      { $ref: '#/components/schemas/InitializeAccountResponse' },
                      { $ref: '#/components/schemas/SendTransactionResponse' },
                      { $ref: '#/components/schemas/ReceiveAllPendingResponse' },
                      { $ref: '#/components/schemas/GetAccountInfoResponse' },
                      { $ref: '#/components/schemas/GetPendingBlocksResponse' },
                      { $ref: '#/components/schemas/GenerateWorkResponse' }
                    ]
                  },
                  examples: {
                    initialize: {
                      summary: 'Initialize response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          version: '1.0.0',
                          capabilities: {
                            methods: [
                              'initialize',
                              'generateWallet',
                              'getBalance',
                              'initializeAccount',
                              'sendTransaction',
                              'receiveAllPending'
                            ]
                          }
                        },
                        id: 1
                      }
                    },
                    generateWallet: {
                      summary: 'Generate wallet response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          publicKey: '9D473FD0CAD0D08C29E6C68CC449976A7E2BFBB3DC6177343023B0E277C56374',
                          privateKey: '781186FB9EF17DB6E3D1056550D9FAE5D5BBADA6A6BC370E4CBB938B1DC71DA3',
                          address: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                        },
                        id: 1
                      }
                    },
                    getBalance: {
                      summary: 'Get balance response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          balance: '1000000000000000000000000000',
                          pending: '0'
                        },
                        id: 1
                      }
                    },
                    initializeAccount: {
                      summary: 'Initialize account response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          initialized: true,
                          representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou'
                        },
                        id: 1
                      }
                    },
                    sendTransaction: {
                      summary: 'Send transaction response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          success: true,
                          hash: '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F',
                          amount: '1000000000000000000000000000',
                          balance: '0'
                        },
                        id: 1
                      }
                    },
                    receiveAllPending: {
                      summary: 'Receive all pending response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          received: [
                            {
                              hash: '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F',
                              amount: '1000000000000000000000000000',
                              source: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                            }
                          ]
                        },
                        id: 1
                      }
                    },
                    getAccountInfo: {
                      summary: 'Get account info response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          frontier: '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F',
                          open_block: '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F',
                          representative_block: '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F',
                          balance: '1000000000000000000000000000',
                          modified_timestamp: '1633072800',
                          block_count: '100',
                          representative: 'nano_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou'
                        },
                        id: 1
                      }
                    },
                    getPendingBlocks: {
                      summary: 'Get pending blocks response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          blocks: {
                            '000D1BAEC8EC208142C99059B393051BAC8380F9B5A2E6B2489A277D81789F3F': {
                              amount: '1000000000000000000000000000',
                              source: 'nano_3t6k35gi95xu6tergt6p69ck76ogmitsa8mnijtpxm9fkcm736xtoncuohr3'
                            }
                          }
                        },
                        id: 1
                      }
                    },
                    generateWork: {
                      summary: 'Generate work response',
                      value: {
                        jsonrpc: '2.0',
                        result: {
                          work: '0000000000000000000000000000000000000000000000000000000000000000'
                        },
                        id: 1
                      }
                    }
                  }
                },
              },
            },
            '400': {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  example: {
                    jsonrpc: '2.0',
                    error: {
                      code: -32603,
                      message: 'Invalid parameters'
                    },
                    id: null
                  }
                }
              }
            }
          }
        },
      },
    },
  },
  apis: ['./src/server.js'],
};

module.exports = swaggerJsdoc(options); 