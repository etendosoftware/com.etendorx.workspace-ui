import { defineConfig } from "cypress";
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file manually
const loadEnv = () => {
  try {
    const envFile = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envFile, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key) {
          envVars[key] = valueParts.join('=');
        }
      }
    });

    // Set environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.log('No .env file found or error loading it:', error.message);
  }
};

loadEnv();

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 720,

    // File settings
    supportFile: "support/e2e.js",
    fixturesFolder: "fixtures",
    screenshotsFolder: "screenshots",
    videosFolder: "videos",
    specPattern: "e2e/**/*.cy.{js,jsx,ts,tsx}",

    // Media settings
    video: true,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,

    // Timeouts (increased for external server)
    defaultCommandTimeout: 15000,
    requestTimeout: 20000,
    responseTimeout: 20000,
    pageLoadTimeout: 60000,

    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0,
    },

    chromeWebSecurity: false,
    blockHosts: [],
    modifyObstructiveThirdPartyCode: true,

    // ✨ CYPRESS STUDIO
    experimentalStudio: true,

    setupNodeEvents(_on, config) {
      return config;
    },

    // Environment variables
    env: {
      baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
      apiUrl: process.env.CYPRESS_API_URL || (process.env.CYPRESS_BASE_URL || "http://localhost:3000") + "/api",
      iframeUrl: process.env.CYPRESS_IFRAME_URL || "localhost:8080",
      defaultUser: process.env.CYPRESS_USER || "admin",
      defaultPassword: process.env.CYPRESS_PASSWORD || "admin",
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
