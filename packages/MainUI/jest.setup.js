require("../../jest.setup.js");
const React = require("react");

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
    route: "/",
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    return React.createElement("img", props);
  },
}));

jest.mock("@/contexts/user", () => ({
  useUser: () => ({
    user: { id: "test-user", name: "Test User" },
    token: "test-token",
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({
    language: "en_US",
    setLanguage: jest.fn(),
    getLabel: (key) => key,
  }),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
