/** @type {import('jest').Config} */
export default {
  displayName: "EtendoTool",
  preset: "ts-jest",
  testEnvironment: "jsdom",

  rootDir: ".",

  setupFilesAfterEnv: ["<rootDir>/../../jest.setup.js"],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg)$": "<rootDir>/../../__mocks__/fileMock.js",
    "^@workspaceui/api-client(.*)$": "<rootDir>/../api-client$1",
    "^@workspaceui/componentlibrary(.*)$": "<rootDir>/../ComponentLibrary$1",
  },

  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "test-utils",
  ],

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
