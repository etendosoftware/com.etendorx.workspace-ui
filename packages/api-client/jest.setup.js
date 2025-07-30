require("jest-extended");

global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

global.FormData = jest.fn(() => ({
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
}));

global.URL = {
  createObjectURL: jest.fn(),
  revokeObjectURL: jest.fn(),
};
