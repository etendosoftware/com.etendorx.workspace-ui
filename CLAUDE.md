# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Etendo WorkspaceUI**, a monorepo containing the main user interface for Etendo ERP. It's built with Next.js, React, TypeScript, and uses pnpm workspaces for package management. The project uses Biome for linting and formatting, and Jest for testing.

## Essential Commands

### Development
```bash
# Install dependencies
pnpm install

# Start development server (runs MainUI)
pnpm dev

# Build entire project
pnpm build

# Run production build
pnpm start
```

### Package-specific Development
```bash
# Work with specific packages
pnpm --filter @workspaceui/mainui dev
pnpm --filter @workspaceui/storybook dev
```

### Code Quality
```bash
# Linting and formatting (uses Biome)
pnpm lint              # Check for linting issues
pnpm lint:fix          # Fix linting issues automatically
pnpm format            # Check formatting
pnpm format:fix        # Fix formatting issues
pnpm check             # Check both linting and formatting
pnpm check:fix         # Fix both linting and formatting

# Alternative check command
biome check .          # Comprehensive check
biome check --apply .  # Apply fixes
```

### Testing
```bash
# Run all tests
pnpm test

# Test by specific project
pnpm test:mainui
pnpm test:api-client
pnpm test:component-library

# Watch mode tests
pnpm test:watch
pnpm test:mainui:watch

# Coverage reports
pnpm test:coverage
pnpm test:mainui:coverage
pnpm test:component-library:coverage
pnpm test:coverage:html  # Generates HTML coverage report
```

### Building Packages
```bash
# Build all packages
pnpm build:all

# Build component library (dual CJS/ESM)
cd packages/ComponentLibrary && pnpm build

# Build API client
cd packages/api-client && pnpm build
```

## Project Architecture

### Workspace Structure
- **`packages/MainUI/`** - Next.js application (main UI)
- **`packages/ComponentLibrary/`** - Shared React components with Material-UI
- **`packages/api-client/`** - API client library for backend communication
- **`packages/storybook/`** - Storybook for component development

### MainUI Architecture (Next.js App)
- **App Router** structure with `app/` directory
- **Context Providers** for state management:
  - `ApiProviderWrapper` - API communication
  - `ThemeProvider` - Material-UI theming
  - `LanguageProvider` - Internationalization
  - `UserProvider` - User authentication state
  - `DatasourceProvider` - Data fetching
  - `MetadataProvider` - ERP metadata
  - `LoadingProvider` - Loading states

### Key Directories in MainUI
- `app/` - Next.js app router pages
- `components/` - UI components (Forms, Tables, Modals, etc.)
- `contexts/` - React context providers
- `hooks/` - Custom React hooks
- `utils/` - Utility functions
- `screens/` - Page-level components

### Component Library
- Built with Material-UI as the design system
- Exports components for use across the workspace
- Dual build system (CommonJS + ESM)
- Uses `@dnd-kit` for drag-and-drop functionality

## Backend Integration

This UI connects to **Etendo Classic** backend. Key integration points:
- API client handles authentication and data fetching
- SSE (Server-Sent Events) for real-time updates
- Process execution and reporting integration
- Metadata-driven form and table generation

## Development Prerequisites

Required repositories in workspace:
- `com.etendoerp.openapi`
- `com.etendoerp.etendorx`
- `com.etendoerp.metadata`
- `com.etendoerp.metadata.template`

## Documentation Standards

**IMPORTANT: All technical documentation MUST be written in English.**

### Documentation Structure
- Use the `/docs` folder for comprehensive technical documentation
- Organize by feature in `/docs/features/[feature-name]/`
- Include architecture decisions in `/docs/architecture/`
- Document patterns and conventions in `/docs/patterns/`

### Documentation Guidelines
- **Language**: English only for all technical documentation
- **Format**: Markdown with Mermaid diagrams where appropriate
- **JSDoc**: Use English for all code documentation and comments
- **Code Comments**: Inline comments should be in English
- **Commit Messages**: English for all commit messages

### Existing Documentation
- `/docs/README.md` - Documentation index and standards
- `/docs/features/process-execution/` - Process execution feature docs
- `/docs/architecture/overview.md` - System architecture overview
- `/docs/patterns/react-patterns.md` - React patterns and conventions

## Important Configuration Files

- `biome.json` - Linting and formatting configuration
- `pnpm-workspace.yaml` - Workspace configuration
- `jest.config.js` - Root Jest configuration
- `packages/MainUI/next.config.ts` - Next.js configuration with SVG handling
- `packages/MainUI/build.sh` - Production build script

## Testing Strategy

Current testing approach uses Jest with React Testing Library:
- Component testing in ComponentLibrary
- Hook testing for MainUI
- API client unit tests
- See `TESTING.md` for detailed testing guidelines and coverage requirements