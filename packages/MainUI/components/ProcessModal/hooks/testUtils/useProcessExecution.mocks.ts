// Shared module mocks for useProcessExecution tests.
// Imported for side effects to register Jest mocks before the hook is loaded.

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/utils", () => ({
  buildProcessPayload: jest.fn(() => ({})),
}));

jest.mock("@/utils/functions", () => ({
  executeStringFunction: jest.fn(),
}));

jest.mock("@/utils/process/processPayloadMapper", () => ({
  buildProcessParameters: jest.fn(() => ({})),
}));

jest.mock("@/utils/processes/definition/constants", () => ({
  BUTTON_LIST_REFERENCE_ID: "BUTTON_LIST",
  PROCESS_DEFINITION_DATA: {},
  WINDOW_SPECIFIC_KEYS: {},
}));

jest.mock("@/components/ProcessModal/Custom/shared/processModalUtils", () => ({
  parseSmartClientMessage: jest.fn((msg: string) => ({ text: msg, tabId: undefined, recordId: undefined })),
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: jest.fn(() => "wi_0"),
}));

jest.mock("@/utils/url/utils", () => ({
  appendWindowToUrl: jest.fn(() => "window=wi_0"),
}));

jest.mock("@/components/ToastContent", () => ({
  ToastContent: jest.fn(),
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { kernelClient: { post: jest.fn() } },
}));

jest.mock("@/utils/propertyStore", () => ({
  createOBShim: jest.fn(() => ({})),
}));

jest.mock("@/utils/process/gridNormalization", () => ({
  normalizeGridValues: jest.fn((v: unknown) => v),
}));

jest.mock("@/app/actions/process", () => ({}));
jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));
jest.mock("sonner", () => ({ toast: jest.fn() }));

export {};
