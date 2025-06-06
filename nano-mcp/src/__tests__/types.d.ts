declare global {
  var fetch: jest.Mock<Promise<MockResponse>, [string, RequestInit?]>;
}

export type MockResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<any>;
}; 