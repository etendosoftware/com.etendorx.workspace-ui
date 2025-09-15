# Session Sync Test Strategy

## Overview

This document outlines the comprehensive testing strategy for the table selection session synchronization feature in Etendo WorkspaceUI. The strategy ensures robust functionality across different scenarios and environments.

## Test Coverage Strategy

### Test Pyramid Structure

```
                    E2E Tests (10%)
                  ┌─────────────────┐
                  │  User Scenarios │
                  │  Cross-browser  │
                  └─────────────────┘
                Integration Tests (20%)
              ┌─────────────────────────┐
              │   Component Integration │
              │   API Communication     │
              │   Hook Interactions     │
              └─────────────────────────┘
            Unit Tests (70%)
          ┌───────────────────────────────┐
          │      Utility Functions        │
          │      Type Definitions         │
          │      Error Handling           │
          │      Session Processing       │
          └───────────────────────────────┘
```

### Coverage Targets

- **Unit Tests**: 95% line coverage for core utilities
- **Integration Tests**: All component interaction paths
- **E2E Tests**: Critical user workflows and cross-browser compatibility
- **Type Tests**: 100% TypeScript type coverage

## Unit Test Strategy

### Core Components to Test

#### 1. SessionSync Utility (`sessionSync.test.ts`) ✅
**Coverage**: 10 comprehensive test cases

```typescript
describe('syncSelectedRecordsToSession', () => {
  // Core functionality tests
  ✅ Single record selection
  ✅ Multiple record selection with MULTIPLE_ROW_IDS
  ✅ Session attribute processing and merging
  ✅ API integration and parameter building
  ✅ Error handling without throwing
  ✅ Empty selection handling
  ✅ Missing key column graceful failure
  ✅ Parent ID parameter propagation
  ✅ Entity key column property validation
  ✅ Response processing and session updates
});
```

#### 2. FormInitialization Utils Extended (`utils.test.ts`) ✅
**Coverage**: 18+ test cases including SessionMode support

```typescript
describe('FormInitialization Utils - SessionMode Support', () => {
  // Parameter building tests
  ✅ buildFormInitializationParams with SessionMode.SETSESSION
  ✅ Parameter building with minimal parameters
  ✅ Mode-specific parameter generation
  
  // Payload construction tests
  ✅ buildFormInitializationPayload for SETSESSION mode
  ✅ Payload extension and merging
  ✅ SessionMode-specific payload structure
  
  // Session attribute processing tests
  ✅ buildSessionAttributes combining auxiliaryInputValues and sessionAttributes
  ✅ Handling missing auxiliaryInputValues gracefully
  ✅ Handling missing sessionAttributes gracefully
  ✅ Empty response handling
  ✅ Conflict resolution (sessionAttributes precedence)
  ✅ Type safety and data validation
});
```

#### 3. useTableSelection Hook Tests (`useTableSelection.session.test.ts`) ✅
**Coverage**: 7 integration test cases

```typescript
describe('useTableSelection - Session Sync Integration', () => {
  ✅ Session sync triggered on selection changes
  ✅ Parent ID propagation to session sync utility
  ✅ Error handling in hook integration
  ✅ Conditional session sync (only when records selected)
  ✅ Existing hook behavior preservation
  ✅ Multiple record selection handling
  ✅ setSession function propagation from useUserContext
});
```

#### 4. SessionMode Type Tests (`types.test.ts`) ✅
**Coverage**: 4 test cases for type system validation

```typescript
describe('SessionMode', () => {
  ✅ SETSESSION mode constant validation
  ✅ Independence from FormMode enum
  ✅ Correct TypeScript type definitions
  ✅ Type system compatibility verification
});
```

### Unit Test Configuration

#### Test Environment Setup

```json
{
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/packages/MainUI/$1",
    "^@workspaceui/(.*)$": "<rootDir>/packages/$1"
  },
  "collectCoverageFrom": [
    "packages/MainUI/utils/hooks/useTableSelection/**/*.ts",
    "packages/MainUI/utils/hooks/useFormInitialization/**/*.ts",
    "packages/api-client/src/api/types.ts",
    "packages/MainUI/hooks/useTableSelection.ts"
  ]
}
```

#### Mock Strategy

```typescript
// Standard mocks for all session sync tests
jest.mock('@/utils/hooks/useFormInitialization/utils');
jest.mock('@/hooks/useUserContext');
jest.mock('@/utils/logger');

// Component-specific mocks
jest.mock('../../useSelected');
jest.mock('../../navigation/useMultiWindowURL');
jest.mock('@/hooks/useStateReconciliation');
jest.mock('@/utils/debounce');
```

## Integration Test Strategy

### Integration Test Suite (`tableSelectionSessionSync.test.ts`) ✅
**Coverage**: 5 comprehensive end-to-end integration tests

```typescript
describe('Table Selection Session Sync Integration', () => {
  ✅ Complete workflow: selection change → session sync → UI update
  ✅ Error handling: API failure → graceful degradation → UI continues
  ✅ Session merging: new attributes + existing session → combined state
  ✅ Multiple selection: MULTIPLE_ROW_IDS payload → correct API structure
  ✅ Single selection: standard payload → no MULTIPLE_ROW_IDS field
});
```

### Integration Test Focus Areas

#### 1. Component Communication
- Hook to utility function data flow
- Session context integration
- Error propagation and handling
- State synchronization across components

#### 2. API Integration
- Request parameter construction
- Payload structure validation
- Response processing
- Error response handling

#### 3. Session Management
- Frontend session state updates
- Session attribute merging
- Conflict resolution
- State persistence

#### 4. User Workflow Simulation
- Realistic user interaction patterns
- Multi-step selection scenarios
- Cross-component data sharing
- Error recovery workflows

## End-to-End Test Strategy

### E2E Test Scenarios

#### Critical User Workflows

1. **Basic Selection Workflow** 🎯
   ```
   User story: As a user, I want my table selections to persist across screens
   
   Test steps:
   1. Navigate to data table
   2. Select multiple records
   3. Navigate to related screen
   4. Verify selected records are available
   
   Expected: Records remain selected and available for operations
   ```

2. **Batch Operation Workflow** 🎯
   ```
   User story: As a user, I want to perform batch operations on selected records
   
   Test steps:
   1. Select records in table
   2. Trigger batch operation
   3. Verify operation processes all selected records
   4. Confirm session data includes all selections
   
   Expected: All selected records processed in batch operation
   ```

3. **Error Recovery Workflow** 🎯
   ```
   User story: As a user, I want table functionality to continue if sync fails
   
   Test steps:
   1. Simulate network disconnection
   2. Attempt record selection
   3. Verify UI remains responsive
   4. Reconnect network and verify recovery
   
   Expected: UI continues to work, sync resumes when connection restored
   ```

### Cross-Browser Testing

#### Supported Browser Matrix

| Browser | Version | Priority | Test Coverage |
|---------|---------|----------|---------------|
| Chrome | 90+ | High | Full E2E suite |
| Firefox | 88+ | High | Full E2E suite |
| Safari | 14+ | Medium | Smoke tests |
| Edge | 90+ | Medium | Smoke tests |

#### Device Testing

| Device Type | Screen Size | Priority | Coverage |
|-------------|-------------|----------|----------|
| Desktop | 1920x1080+ | High | Full suite |
| Laptop | 1366x768+ | High | Full suite |
| Tablet | 768x1024+ | Medium | Core scenarios |
| Mobile | 375x667+ | Low | Smoke tests |

## Performance Testing

### Load Testing Scenarios

#### Selection Size Performance

```typescript
describe('Selection Size Performance', () => {
  test('10 records - should complete in <100ms', async () => {
    const startTime = performance.now();
    await selectRecords(generateRecords(10));
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(100);
  });
  
  test('50 records - should complete in <300ms', async () => {
    const startTime = performance.now();
    await selectRecords(generateRecords(50));
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(300);
  });
  
  test('100 records - should complete in <1000ms', async () => {
    const startTime = performance.now();
    await selectRecords(generateRecords(100));
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(1000);
  });
});
```

#### Network Performance

```typescript
describe('Network Conditions', () => {
  test('Fast 3G - should handle normal selections', async () => {
    await throttleNetwork('fast3G');
    await testNormalSelectionWorkflow();
  });
  
  test('Slow 3G - should handle with graceful degradation', async () => {
    await throttleNetwork('slow3G');
    await testDegradedSelectionWorkflow();
  });
  
  test('Offline - should continue UI functionality', async () => {
    await setOffline(true);
    await testOfflineSelectionWorkflow();
  });
});
```

## Test Execution Strategy

### Local Development Testing

```bash
# Run all session sync tests
pnpm test -- --testPathPattern=session

# Run with coverage
pnpm test:coverage -- --testPathPattern=session

# Run specific test suites
pnpm test -- sessionSync.test.ts
pnpm test -- useTableSelection.session.test.ts
pnpm test -- tableSelectionSessionSync.test.ts

# Run integration tests only
pnpm test -- --testPathPattern=integration
```

### Continuous Integration Pipeline

```yaml
# CI Test Pipeline
session-sync-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Unit Tests
      run: pnpm test -- --testPathPattern=session --coverage
      
    - name: Integration Tests  
      run: pnpm test -- --testPathPattern=integration
      
    - name: Type Tests
      run: pnpm test -- --testPathPattern=types
      
    - name: Coverage Report
      run: pnpm test:coverage:report
      
  coverage_threshold:
    unit_tests: 95%
    integration_tests: 90%
    overall: 90%
```

### Pre-Release Testing

#### Smoke Test Suite (5 minutes)
- ✅ Basic selection functionality
- ✅ Session sync integration
- ✅ Error handling
- ✅ Cross-browser compatibility (Chrome, Firefox)

#### Full Regression Suite (30 minutes)
- ✅ All unit tests
- ✅ All integration tests  
- ✅ E2E critical paths
- ✅ Performance benchmarks
- ✅ Cross-browser testing
- ✅ Mobile device testing

## Test Data Management

### Mock Data Strategy

#### Realistic Test Data
```typescript
const mockTab = createMockTab({
  id: 'sales-order-tab',
  entityName: 'SalesOrder',
  fields: {
    id: createMockField({ keyColumn: true }),
    orderNo: createMockField({ type: 'string' }),
    customer: createMockField({ type: 'reference' })
  }
});

const mockRecords = createMockRecords({
  count: 50,
  entity: 'SalesOrder',
  pattern: 'realistic-sales-data'
});
```

#### Edge Case Data
```typescript
const edgeCaseScenarios = [
  { name: 'Empty Selection', records: [] },
  { name: 'Single Record', records: [mockRecord1] },
  { name: 'Large Selection', records: generateRecords(500) },
  { name: 'Special Characters', records: recordsWithSpecialChars },
  { name: 'Unicode Data', records: recordsWithUnicode }
];
```

## Test Quality Assurance

### Code Quality Metrics

```typescript
// Test quality checks
describe('Test Quality Assurance', () => {
  test('All test files have proper descriptions', () => {
    // Verify test descriptions are meaningful
  });
  
  test('Mock objects match real interfaces', () => {
    // Verify mock type compatibility
  });
  
  test('Test coverage meets requirements', () => {
    // Verify coverage thresholds
  });
});
```

### Test Maintenance

#### Regular Review Process
- **Weekly**: Review failing tests and flaky tests
- **Monthly**: Update test data and scenarios
- **Quarterly**: Review test strategy and coverage
- **Release**: Full regression suite execution

#### Test Documentation
- All test files include clear descriptions
- Complex test scenarios have inline comments
- Mock strategies are documented
- Test data patterns are explained

## Monitoring and Reporting

### Test Metrics Dashboard
- **Coverage Trends**: Track coverage over time
- **Test Execution Times**: Monitor performance
- **Flaky Test Identification**: Track unstable tests
- **Browser Compatibility**: Success rates by browser

### Automated Reporting
- **Daily**: Test execution summary
- **Weekly**: Coverage and quality report
- **Release**: Comprehensive test report
- **Incident**: Test failure analysis

## Conclusion

This comprehensive test strategy ensures:

1. **High Quality**: 95%+ test coverage with meaningful tests
2. **Reliable Functionality**: Integration tests verify complete workflows
3. **User Confidence**: E2E tests validate real-world scenarios
4. **Performance Assurance**: Load tests verify acceptable response times
5. **Maintainability**: Clear documentation and quality standards

The strategy supports continuous development while maintaining high standards for user-facing functionality.
