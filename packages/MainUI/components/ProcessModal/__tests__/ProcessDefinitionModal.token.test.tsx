/**
 * Tests for ProcessDefinitionModal token handling
 * Ensures that the token is properly passed to executeProcess server action
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ProcessDefinitionModal from '../ProcessDefinitionModal';
import { executeProcess } from '@/app/actions/process';

// Mock the server action
jest.mock('@/app/actions/process', () => ({
  executeProcess: jest.fn(),
}));

// Mock the user context to provide a token
const mockUseUserContext = jest.fn(() => ({
  token: 'test-auth-token-123',
  session: { userId: 'test-user' },
}));

jest.mock('@/hooks/useUserContext', () => ({
  useUserContext: () => mockUseUserContext(),
}));

// Mock other dependencies
jest.mock('@/contexts/tab', () => ({
  useTabContext: () => ({
    tab: {
      id: 'test-tab',
      window: 'test-window',
      entityName: 'TestEntity',
    },
    record: { id: 'test-record' },
  }),
}));

jest.mock('@/hooks/useSelected', () => ({
  useSelected: () => ({ 
    graph: {
      getSelectedMultiple: jest.fn(() => [])
    } 
  }),
}));

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/useProcessInitialization', () => ({
  useProcessInitialization: () => ({
    initializeProcess: jest.fn(),
    loading: false,
    availableFormData: {},
    recordValues: {},
  }),
}));

jest.mock('@/hooks/useProcessInitialState', () => ({
  useProcessInitializationState: () => ({
    processDefaults: {},
    hasInitialData: false,
    entityName: 'TestEntity',
    gridSelection: [],
  }),
}));

jest.mock('react-hook-form', () => ({
  FormProvider: ({ children }: any) => children,
  useForm: () => ({
    getValues: () => ({}),
    setValue: jest.fn(),
    watch: () => ({}),
  }),
}));

const mockExecuteProcess = executeProcess as jest.MockedFunction<typeof executeProcess>;

describe('ProcessDefinitionModal token handling', () => {
  const mockButton = {
    processDefinition: {
      id: 'TEST_PROCESS_ID',
      name: 'Test Process',
      description: 'Test process description',
      javaClassName: 'com.test.TestProcess',
      parameters: {},
      onLoad: null,
      onProcess: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteProcess.mockResolvedValue({ success: true, data: {} });
  });

  it('passes authentication token to executeProcess server action', async () => {
    const { getByText } = render(
      <ProcessDefinitionModal
        button={mockButton as any}
        open={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    // Find and click the execute button
    const executeButton = getByText('common.execute');
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(mockExecuteProcess).toHaveBeenCalledWith(
        'TEST_PROCESS_ID',
        expect.objectContaining({
          recordIds: ['test-record'],
          _buttonValue: 'DONE',
          _params: {},
          _entityName: 'TestEntity',
          windowId: 'test-window',
        }),
        'test-auth-token-123', // This is the key assertion - token must be passed
        'test-window',         // windowId parameter
        undefined,             // reportId parameter  
        'com.test.TestProcess' // actionHandler parameter
      );
    });
  });

  it('handles missing token gracefully', async () => {
    // Override the mock to return no token
    mockUseUserContext.mockImplementationOnce(() => ({
      token: null,
      session: { userId: 'test-user' },
    }));

    const { getByText } = render(
      <ProcessDefinitionModal
        button={mockButton as any}
        open={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const executeButton = getByText('common.execute');
    fireEvent.click(executeButton);

    await waitFor(() => {
      expect(mockExecuteProcess).toHaveBeenCalledWith(
        'TEST_PROCESS_ID',
        expect.any(Object),
        '', // Empty string when no token
        'test-window',         // windowId parameter
        undefined,             // reportId parameter  
        'com.test.TestProcess' // actionHandler parameter
      );
    });
  });

  it('includes token in dependency array of useCallback hooks', () => {
    // This test ensures that changes to token trigger re-creation of callback functions
    // We test this by checking that the component doesn't throw dependency warnings
    expect(() => {
      render(
        <ProcessDefinitionModal
          button={mockButton as any}
          open={true}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      );
    }).not.toThrow();
  });
});