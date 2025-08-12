## Testing & Coverage Guide

## 🧪 Testing Commands

### Basic tests
````bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests per specific project
npm run test:mainui
npm run test:api-client
npm run test:component-library
````

### Coverage (Code Coverage)

To get a complete coverage report that includes **all untested components/hooks**:

#### 1. Coverage by individual project (RECOMMENDED)
````bash
# ComponentLibrary - Show all untested components
npm run test:component-library:coverage

# MainUI - Show all hooks/contexts/utils without tests 
npm run test:mainui:coverage

# API Client - Show all functions without tests
npm run test:api-client:coverage
````

#### 2. Detailed coverage with direct command
````bash
# For ComponentLibrary (more complete example)
cd packages/ComponentLibrary
npx jest --coverage --collectCoverageFrom="src/**/*.{ts,tsx}" --collectCoverageFrom="!src/**/**/*.test.{ts,tsx}" --collectCoverageFrom="!src/**/**/__tests__/**"
````

#### 3. Coverage HTML (visual report)
````bash
npm run test:coverage:html.
# Open: coverage/lcov-report/index.html in your browser
````

## 📊 Interpreting Coverage

### Current Project Status

**ComponentLibrary** (1 component tested out of ~80+ components):
- ✅ `IconButton`: 82.6% statements, 87.5% branches.  
- ❌ `BasicModal`, `Drawer`, `SearchModal`, `Table`, etc.: 0% coverage

**MainUI & API Client`: No tests yet

### Coverage Metrics

- Statements**: % of executed lines of code
- Branches**: % of tested conditional (if/else) branches
- Functions**: % of called functions
- Lines**: % of non-empty lines executed

### Files Excluded from Coverage

Automatically excluded:
- `*.test.tsx` - test files
- `*.stories.tsx` - Storybook files
- `**/index.tsx` - re-export files
- `**/types.tsx` - type definitions
- `**/constants.tsx` - constants

## ✅ Example of Successful Test

See: `packages/ComponentLibrary/src/components/IconButton/__tests__/IconButton.test.tsx`.

This test covers:
- Rendering with children
- Props (aria-label, disabled, iconText)
- Events (click, keyboard)
- States (enabled/disabled)

## 🎯 Next Components to Test

**High Priority** (most used components):
`BasicModal` 1.
SearchModal
3. `Drawer`
4. `Table`/`TableV2`
5. `Input` components

**AveragePriority`:
- `SecondaryTabs`
- PrimaryTab
- NotificationsModal
- `Tag`

**Hooks to test`:
- `useLocalStorage`
- `useEventListeners`
- `useItemType`

## 🚀 Tips for Increasing Coverage

1. **Start with simple components** such as `Spinner`, `Logo`.
2. **Test components without external dependencies** first.
3. **Use mocks for complex dependencies** (see example in IconButton)
4. **Focus on real use cases** rather than 100% coverage.
5. **Test critical props and important events.

## 🛠 Jest Configuration

- Main setup**: `jest.setup.js`: `jest.config.js`.
- **Global setup**: `jest.setup.js`.
- Per project settings**: `packages/*/jest.config.js` **Mocks**: `packages/*/jest.config.js` **Mocks**: `packages/*/__mocks__/``
- **Mocks**: `packages/*/*/__mocks__/`

Current configuration allows:
- Tests in TypeScript/TSX
- React Testing Library
- Mocks for assets (CSS, images)
- Setup for localStorage, ResizeObserver, etc.
