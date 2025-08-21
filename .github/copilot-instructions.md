# GitHub Copilot Instructions for Etendo WorkspaceUI

This document provides guidance to GitHub Copilot when working with the Etendo WorkspaceUI codebase.

## Project Overview

**Etendo WorkspaceUI** is a comprehensive monorepo containing the main user interface for Etendo ERP. The project is built with modern web technologies and follows enterprise-grade development practices.

### Technology Stack
- **Frontend Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+ with TypeScript 5+
- **Design System**: Material-UI (MUI)
- **Package Manager**: pnpm with workspaces
- **Linting & Formatting**: Biome
- **Testing**: Jest with React Testing Library
- **State Management**: React Context API
- **Real-time Communication**: Server-Sent Events (SSE)

### Workspace Structure
```
packages/
├── MainUI/              # Next.js application (main UI)
├── ComponentLibrary/    # Shared React components with Material-UI
├── api-client/         # API client library for backend communication
└── storybook/          # Storybook for component development
```

## Coding Standards and Patterns

### Code Style
- **Language**: All code, comments, and documentation must be in English
- **Formatting**: 120 character line width, 2-space indentation
- **Quotes**: Double quotes for JavaScript/TypeScript, JSX attributes
- **Semicolons**: Always required
- **Trailing Commas**: ES5 style (objects/arrays only)
- **Import Protocol**: Use `node:` protocol for Node.js built-ins (e.g., `node:fs`, `node:path`)

### TypeScript Guidelines
- **Strict Mode**: Enabled with strict null checks
- **Type Safety**: Avoid `any` types (use `unknown` or proper typing instead)
- **Non-null Assertions**: Use sparingly and only when necessary
- **Unused Variables**: Must be prefixed with underscore if intentional

### File Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase starting with `use` (e.g., `useAuthentication.ts`)
- **Utilities**: camelCase (e.g., `dateFormatter.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types/Interfaces**: PascalCase with descriptive names

## Package-Specific Guidance

### MainUI Package (`packages/MainUI/`)
- **Architecture**: Next.js App Router with React Server Components
- **Directory Structure**:
  - `app/` - Next.js app router pages and layouts
  - `components/` - Reusable UI components
  - `contexts/` - React context providers
  - `hooks/` - Custom React hooks
  - `utils/` - Utility functions and helpers
  - `screens/` - Page-level components

#### Key Context Providers
```typescript
// Essential providers for the application
- ApiProviderWrapper    // API communication
- ThemeProvider        // Material-UI theming
- LanguageProvider     // Internationalization
- UserProvider         // User authentication state
- DatasourceProvider   // Data fetching
- MetadataProvider     // ERP metadata
- LoadingProvider      // Loading states
```

#### Component Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow Material-UI design patterns
- Use TypeScript interfaces for props
- Include JSDoc comments for complex components

### ComponentLibrary Package (`packages/ComponentLibrary/`)
- **Purpose**: Shared UI components across the workspace
- **Design System**: Material-UI based with custom theming
- **Build Target**: Dual build (CommonJS + ESM)
- **Special Features**: Drag-and-drop functionality with `@dnd-kit`

#### Component Development
```typescript
// Example component structure
export interface ComponentProps {
  // Always define prop interfaces
  title: string;
  onAction: (id: string) => void;
  variant?: 'primary' | 'secondary';
}

export const Component: React.FC<ComponentProps> = ({
  title,
  onAction,
  variant = 'primary'
}) => {
  // Implementation
};
```

### API Client Package (`packages/api-client/`)
- **Purpose**: Centralized API communication with Etendo Classic backend
- **Features**: Authentication, data fetching, SSE connections
- **Special Integration**: Copilot AI service integration

#### API Client Patterns
```typescript
// Follow established patterns for new API clients
export class NewAPIClient {
  public static client = new Client();
  private static currentBaseUrl = "";
  
  // Always include proper initialization
  public static setBaseUrl(url: string) { }
  public static setToken(token: string) { }
  
  // Include comprehensive error handling
  public static async makeRequest(): Promise<ResponseType> {
    try {
      const { data, ok } = await this.request(endpoint, options);
      if (!ok) throw new Error("Request failed");
      return data as ResponseType;
    } catch (error) {
      console.error("Error description:", error);
      throw error;
    }
  }
}
```

## Backend Integration

### Etendo Classic Connection
- **Architecture**: Proxy-based communication through Next.js API routes
- **Authentication**: Token-based authentication with session management
- **Data Flow**: Metadata-driven form and table generation
- **Real-time**: SSE for live updates and process execution

### API Patterns
- Use the established `Client` class for HTTP requests
- Implement proper error handling and response parsing
- Follow the proxy pattern for backend communication
- Include comprehensive logging for debugging

## Development Workflow

### Essential Commands
```bash
# Development
pnpm install              # Install dependencies
pnpm dev                 # Start development server
pnpm build               # Build entire project

# Code Quality
pnpm lint                # Check linting issues
pnpm lint:fix            # Fix linting issues automatically
pnpm format              # Check formatting
pnpm format:fix          # Fix formatting issues
pnpm check               # Check both linting and formatting
pnpm check:fix           # Fix both linting and formatting

# Testing
pnpm test                # Run all tests
pnpm test:mainui         # Test MainUI package
pnpm test:api-client     # Test API client package
pnpm test:component-library # Test ComponentLibrary package
pnpm test:coverage       # Generate coverage reports
```

### Package-Specific Development
```bash
# Work with specific packages
pnpm --filter @workspaceui/mainui dev
pnpm --filter @workspaceui/storybook dev
pnpm --filter @workspaceui/component-library build
```

## Testing Guidelines

### Testing Strategy
- **Unit Tests**: Jest with React Testing Library
- **Component Tests**: Focus on behavior, not implementation
- **Integration Tests**: Test API interactions and data flow
- **Coverage**: Maintain high coverage for critical paths

### Testing Patterns
```typescript
// Component testing example
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('should handle user interaction correctly', () => {
    const mockHandler = jest.fn();
    render(<Component onAction={mockHandler} title="Test" />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalledWith(expect.any(String));
  });
});
```

## Common Patterns and Best Practices

### Error Handling
```typescript
// Consistent error handling pattern
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Descriptive error message:', error);
  throw new Error('User-friendly error message');
}
```

### State Management
```typescript
// Context pattern for global state
export const useCustomContext = () => {
  const context = useContext(CustomContext);
  if (!context) {
    throw new Error('useCustomContext must be used within CustomProvider');
  }
  return context;
};
```

### Form Handling
- Use controlled components with React Hook Form when needed
- Implement proper validation with Material-UI integration
- Follow the established form patterns in the codebase

### Data Fetching
- Use the `DatasourceProvider` for data management
- Implement proper loading states with `LoadingProvider`
- Handle errors gracefully with user-friendly messages

## Documentation Standards

### Code Documentation
- **JSDoc**: Use for all public APIs and complex functions
- **Inline Comments**: Explain business logic and complex algorithms
- **README Files**: Include in each package for specific guidance
- **Architecture Decisions**: Document in `/docs/architecture/`

### Existing Documentation
- `/docs/README.md` - Documentation index and standards
- `/docs/features/` - Feature-specific documentation
- `/docs/architecture/` - System architecture overview
- `/docs/patterns/` - Development patterns and conventions
- `CLAUDE.md` - Comprehensive development guide
- `TESTING.md` - Testing guidelines and coverage requirements

## Security Considerations

- **Input Validation**: Always validate and sanitize user inputs
- **Authentication**: Use the established token-based authentication
- **CORS**: Follow the configured CORS policies
- **Environment Variables**: Never commit secrets to the repository

## Performance Guidelines

- **Bundle Size**: Monitor and optimize bundle sizes
- **Lazy Loading**: Use dynamic imports for large components
- **Memoization**: Use React.memo and useMemo appropriately
- **Image Optimization**: Use Next.js Image component for assets

## Accessibility (a11y)

- **Semantic HTML**: Use proper HTML semantics
- **ARIA Labels**: Include appropriate ARIA attributes
- **Keyboard Navigation**: Ensure all interactions are keyboard accessible
- **Screen Readers**: Test with screen reader compatibility

## Special Features

### Copilot Integration
- **Location**: `packages/api-client/src/api/copilot/`
- **Features**: File uploads, question processing, SSE streaming
- **Patterns**: Follow established client patterns for AI integration

### Process Execution
- **Location**: Various process-related utilities in MainUI
- **Features**: Manual process execution, parameter handling
- **Documentation**: See `/docs/features/process-execution/`

## Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors and missing dependencies
2. **Lint Errors**: Run `pnpm check:fix` to auto-fix formatting issues
3. **Test Failures**: Ensure proper mocking and async handling
4. **SSE Connection Issues**: Check authentication and URL configuration

### Debug Mode
- Use environment variables for debug logging
- Enable detailed error reporting in development
- Monitor network requests in browser dev tools

## When Contributing

1. **Code Style**: Ensure all code follows the established patterns
2. **Testing**: Add tests for new functionality
3. **Documentation**: Update relevant documentation
4. **Linting**: Fix all linting errors before committing
5. **Type Safety**: Maintain strict TypeScript compliance

This document should be used as a reference for understanding the project structure, coding standards, and development patterns when working with the Etendo WorkspaceUI codebase.