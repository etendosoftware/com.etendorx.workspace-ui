# Etendo Main UI - End-to-End Tests 🚀

This repository contains comprehensive end-to-end tests for the Etendo Main UI application using the **Cypress** testing framework.

## 🛠 Prerequisites

Make sure you have the following items installed on your system:

- **Node.js** (v18.x or higher)
- **pnpm** (latest)

## ⚠️ Important Setup Requirements

This testing repository is independent from the main UI repository. Before running any tests, you must have the Etendo Main UI application running on port 3000.

### UI Application Setup

Make sure the Etendo Main UI application is running locally
The application should be accessible at http://localhost:3000
If your UI application runs on a different port, update the baseUrl in the cypress.config.js file:

```javascript
// cypress.config.js
{
  e2e: {
    baseUrl: "http://localhost:3000" // Change this to your UI application port
  }
}
```

### Clone the repository

```bash
git clone git@bitbucket.org:koodu_software/com.etendoerp.ui.tests.git
cd com.etendoerp.ui.tests
```

### Install dependencies with pnpm

```bash
pnpm install
```

### Environment Variables (.env file)

You must create a `.env` file in the project root to configure the environment against which the tests will run.

Create a `.env` file manually and copy the following content:

<details>
<summary>.env content</summary>

```bash
# Cypress Environment Variables
# Update with your values

# Base URL for the application under test
# For local development:
CYPRESS_BASE_URL=http://localhost:3000
# For labs environment:
# CYPRESS_BASE_URL=https://new-mainui.erp.labs.etendo.cloud

# API URL (if different from baseUrl + /api)
CYPRESS_API_URL=http://localhost:3000/api
# For labs environment:
# CYPRESS_API_URL=https://new-mainui.erp.labs.etendo.cloud/api

# iframe URL for legacy components
CYPRESS_IFRAME_URL=localhost:8080
# For labs environment:
# CYPRESS_IFRAME_URL=classic-new-mainui

# Test credentials
CYPRESS_USER=admin
CYPRESS_PASSWORD=admin
```

</details>

⚠️ The `.env` file is required, otherwise the tests will not know against which environment to run.

## 🚀 First Steps

### Open Cypress Test Runner

To launch Cypress in interactive mode:

```bash
pnpm cy:open
```

This command will open the Cypress application where you can select and run tests interactively.

## 📖 Step-by-Step Guide

### 1. Welcome Screen

When you open Cypress for the first time, you will see the welcome screen:

- Select **E2E Testing** for end-to-end testing.
- Select **Component Testing** for isolated component testing.

### 2. Browser Selection

Select your preferred browser to run the tests:

- **Electron** (recommended for development)
- Other browsers available depending on your system

### 3. Test Dashboard

Once configured, you will see the test panel with the available files:

- The **Specs** panel shows all test files
- The **Runs** panel shows the execution history
- Click on any file to run it

## 🧪 Running Tests

### Interactive Mode (recommended for development)

```bash
pnpm cy:open
```

### Headless Mode (for CI/CD)

```bash
pnpm cy:run
```

### Run a specific file

```bash
pnpm cypress run --spec “cypress/e2e/smoke/02-SalesOrder.cy.js”
```