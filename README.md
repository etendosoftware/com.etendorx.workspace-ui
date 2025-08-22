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

## 🐳 Docker Deployment

This repository uses a **release-based Docker workflow**. Docker images are built and published only when version tags are created, ensuring consistent and versioned deployments.

### Quick Start with Docker

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Set your desired UI version and backend URL in `.env`:**
   ```bash
   UI_VERSION=1.2.3  # Use specific version for production
   ETENDO_CLASSIC_URL=http://your-backend:8080/etendo
   ```

3. **Deploy using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

### Version Management

- **Production deployments** should use specific version tags (e.g., `1.2.3`, `2.0.1`)
- **Development** can use `latest` tag for the most recent release
- **Update to specific version:**
  ```bash
  ./scripts/update-ui-version.sh 1.2.3
  docker-compose pull etendo_ui
  docker-compose up -d etendo_ui
  ```

### Release Process

Docker images are automatically built and published when:
- A new Git tag is created (e.g., `v1.2.3` or `1.2.3`)
- Images are tagged with both the version number and `latest`

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

---

## Data-testid check

This repository runs an automated `data-testid` check in CI that ensures React components have a deterministic `data-testid` attribute added by a codemod.

Quick local commands:

```fish
# 1) Dry-run check (CI runs this automatically):
pnpm run check:data-testid

# 2) If the check reports changes, apply them locally:
pnpm run apply:data-testid
git add -A
git commit -m "Feature XXX: Apply add-data-testid codemod"

```

Files and scripts:
- `scripts/add-data-testid.cjs` — transformer that adds `data-testid` attributes.
- `scripts/check-add-data-testid.sh` — runs a dry-run and fails if modifications would be made.
- `scripts/apply-add-data-testid.sh` — applies codemod and can commit changes.

Please run the check and apply the codemod in your branch before opening a PR to avoid the CI marking the build as UNSTABLE.
