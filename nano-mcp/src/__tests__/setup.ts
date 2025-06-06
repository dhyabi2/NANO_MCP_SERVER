import { jest } from '@jest/globals';

// Mock fetch for node-fetch
const mockResponse = {
  ok: true,
  json: () => Promise.resolve({})
};

(global as any).fetch = jest.fn(() => Promise.resolve(mockResponse));

// Mock crypto for nanocurrency-web
(global as any).crypto = {
  getRandomValues: (buffer: Uint8Array) => {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  }
}; 