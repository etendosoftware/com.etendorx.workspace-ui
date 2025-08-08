# 🚀 Etendo Main UI Installation

Welcome to the Etendo Main UI repository! This document provides a clear and formal guide on setting up and running the main user interface for Etendo.

## 🛠 Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- [pnpm](https://pnpm.io/) (latest version)

Additionally, ensure you have the following repositories cloned in your workspace:

- `com.etendoerp.openapi`
- `com.etendoerp.etendorx`
- `com.etendoerp.metadata`
- `com.etendoerp.metadata.template`

**Note:** The latest developments are typically found in the `develop` branch.

## ⚙️ Backend Configuration (for data access)

To fetch data from the backend, you need to have **Etendo Classic running** with the necessary modules installed.

You can set it up in one of the following ways:

- Locally with all modules properly configured.
- **Using Docker** (recommended for quick setup):  
  Use the official repository:  
  [`https://github.com/etendosoftware/com.etendoerp.mainui`](https://github.com/etendosoftware/com.etendoerp.mainui)

Make sure the backend is running and accessible before interacting with data in the UI.

---

# WorkspaceUI Monorepo

### Install pnpm

Install pnpm globally if you haven't already:

```bash
npm install -g pnpm
```

or using brew (MacOS):

```bash
brew install pnpm
```

### Install packages using pnpm

```bash
pnpm install
```

### ▶️ Running the app

**Development Mode:**

```bash
pnpm dev
```

**Production Mode:**

```bash
pnpm build
pnpm start
```

---

## 📘 Storybook Setup

**Note:** Work inside `./packages/storybook`.

### Prepare Environment

```bash
rm -rf node_modules
rm -rf storybook-static
pnpm store prune
pnpm install
```

### ▶️ Run Storybook in Development Mode

```bash
pnpm dev
```

### Build Storybook for Production

```bash
pnpm build
```

Make sure `package.json` inside `./packages/storybook` includes:

```json
"scripts": {
  "dev": "start-storybook -p 6006",
  "build": "build-storybook"
}
```

---

## 📧 Support

For any issues or questions, please reach out to the maintainers or open an issue in this repository.

Happy coding! 🌟

---

## Reference Docs

- `docs/datasource-proxy-session.md` — ERP proxy modes (stateful/session‑less), JSON passthrough via `?isc_dataFormat=json`.
- `docs/callouts-behavior.md` — Form callouts execution model, batch application without cascades, entries injection, and debugging with `DEBUG_CALLOUTS`.
