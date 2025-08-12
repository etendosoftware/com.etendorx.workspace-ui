require("@testing-library/jest-dom");
require("jest-extended");

require("jest-canvas-mock");

// Provide WHATWG URL and TextEncoder/TextDecoder early for modules imported at test load time
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeUrl = require('url');
  if (typeof URL === 'undefined') {
    global.URL = nodeUrl.URL;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util');
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = util.TextEncoder;
  }
  if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = util.TextDecoder;
  }
  // Provide Web Fetch API classes if missing (Next internals expect them)
  try {
    if (typeof global.Request === 'undefined' || typeof global.Headers === 'undefined' || typeof global.Response === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const undici = require('undici');
      if (undici.Request) global.Request = undici.Request;
      if (undici.Headers) global.Headers = undici.Headers;
      if (undici.Response) global.Response = undici.Response;
      if (!global.fetch && undici.fetch) global.fetch = undici.fetch;
    }
  } catch (_) {}
} catch (_) {}

// Final fallback polyfill for Response (if still missing) so Next's internals (which call Response.json) work in tests
if (typeof global.Response === 'undefined') {
  class SimpleResponse {
    constructor(body = null, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers || new Map();
    }
    static json(data, init = {}) {
      const body = JSON.stringify(data);
      const headers = new Map();
      headers.set('content-type', 'application/json');
      return new SimpleResponse(body, { ...init, headers });
    }
    async json() {
      try {
        if (typeof this._body === 'string') return JSON.parse(this._body);
        return this._body;
      } catch {
        return null;
      }
    }
    async text() {
      if (typeof this._body === 'string') return this._body;
      return JSON.stringify(this._body);
    }
  }
  // @ts-ignore
  global.Response = SimpleResponse;
}

const { configure } = require("@testing-library/react");

configure({
  testIdAttribute: "data-testid",
});

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, "sessionStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const originalError = console.error;
beforeAll(() => {
  // Ensure WHATWG URL exists globally in tests
  try {
    if (typeof URL === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeUrl = require('url');
      global.URL = nodeUrl.URL;
    }
    // Ensure TextEncoder/TextDecoder exist for Next internals
    if (typeof global.TextEncoder === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const util = require('util');
      global.TextEncoder = util.TextEncoder;
      global.TextDecoder = util.TextDecoder;
    }
  } catch (_) {}

  console.error = (...args) => {
    if (
      typeof args[0] === "string" && (
        args[0].includes("Warning: ReactDOM.render is deprecated") ||
        args[0].includes("Warning: An update to") && args[0].includes("not wrapped in act(")
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
