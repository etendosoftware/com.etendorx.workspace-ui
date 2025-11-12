/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { 
  saveRecord, 
  createNewRecord, 
  updateExistingRecord, 
  createSaveOperation, 
  processSaveErrors, 
  getGeneralErrorMessage 
} from '../utils/saveOperations';
import { Metadata } from '@workspaceui/api-client/src/api/metadata';
import type { EntityData, Tab } from '@workspaceui/api-client/src/api/types';
import { FormMode } from '@workspaceui/api-client/src/api/types';
import type { EditingRowData, SaveOperation, ValidationError } from '../types/inlineEditing';

// Mock the Metadata module
jest.mock('@workspaceui/api-client/src/api/metadata');
const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

// Mock the utility functions
jest.mock('@/utils', () => ({
  buildQueryString: jest.fn(() => 'mocked-query-string'),
}));

jest.mock('@/utils/form/entityConfig', () => ({
  shouldRemoveIdFields: jest.fn(() => false),
}));

jest.mock('@/utils/form/normalizeDates', () => ({
  normalizeDates: jest.fn((data) => data),
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('saveOperations', () => {
  const mockTab: Tab = {
    id: 'test-tab',
    entityName: 'TestEntity',
    name: 'Test Tab',
    window: 'test-window',
  } as Tab;

  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSaveOperation', () => {
    it('should create save operation for new record', () => {
      const editingRowData: EditingRowData = {
        originalData: { id: 'new_123' },
        modifiedData: { name: 'Test Name', value: 100 },
        isNew: true,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const result = createSaveOperation('new_123', editingRowData);

      expect(result).toEqual({
        rowId: 'new_123',
        isNew: true,
        data: { id: 'new_123', name: 'Test Name', value: 100 },
        originalData: undefined,
      });
    });

    it('should create save operation for existing record', () => {
      const editingRowData: EditingRowData = {
        originalData: { id: '456', name: 'Original Name', value: 50 },
        modifiedData: { name: 'Updated Name', value: 100 },
        isNew: false,
        validationErrors: {},
        isSaving: false,
        hasUnsavedChanges: true,
      };

      const result = createSaveOperation('456', editingRowData);

      expect(result).toEqual({
        rowId: '456',
        isNew: false,
        data: { id: '456', name: 'Updated Name', value: 100 },
        originalData: { id: '456', name: 'Original Name', value: 50 },
      });
    });
  });

  describe('saveRecord', () => {
    it('should successfully save new record', async () => {
      const saveOperation: SaveOperation = {
        rowId: 'new_123',
        isNew: true,
        data: { id: 'new_123', name: 'Test Name' },
      };

      const mockResponse = {
        ok: true,
        data: {
          response: {
            status: 0,
            data: [{ id: '789', name: 'Test Name' }],
          },
        },
      };

      mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

      const result = await saveRecord({
        saveOperation,
        tab: mockTab,
        userId: mockUserId,
      });

      expect(result).toEqual({
        success: true,
        data: { id: '789', name: 'Test Name' },
      });

      expect(mockMetadata.datasourceServletClient.request).toHaveBeenCalledWith(
        'TestEntity?mocked-query-string',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            operationType: 'add',
            data: expect.objectContaining({
              name: 'Test Name',
            }),
          }),
        })
      );
    });

    it('should successfully save existing record', async () => {
      const saveOperation: SaveOperation = {
        rowId: '456',
        isNew: false,
        data: { id: '456', name: 'Updated Name' },
        originalData: { id: '456', name: 'Original Name' },
      };

      const mockResponse = {
        ok: true,
        data: {
          response: {
            status: 0,
            data: [{ id: '456', name: 'Updated Name' }],
          },
        },
      };

      mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

      const result = await saveRecord({
        saveOperation,
        tab: mockTab,
        userId: mockUserId,
      });

      expect(result).toEqual({
        success: true,
        data: { id: '456', name: 'Updated Name' },
      });

      expect(mockMetadata.datasourceServletClient.request).toHaveBeenCalledWith(
        'TestEntity?mocked-query-string',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            operationType: 'update',
            oldValues: { id: '456', name: 'Original Name' },
          }),
        })
      );
    });

    it('should handle server validation errors', async () => {
      const saveOperation: SaveOperation = {
        rowId: '456',
        isNew: false,
        data: { id: '456', name: '' },
        originalData: { id: '456', name: 'Original Name' },
      };

      const mockResponse = {
        ok: false,
        data: {
          response: {
            status: 1,
            error: {
              message: 'Validation failed',
              fieldErrors: {
                name: 'Name is required',
              },
            },
          },
        },
      };

      mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

      const result = await saveRecord({
        saveOperation,
        tab: mockTab,
        userId: mockUserId,
      });

      expect(result).toEqual({
        success: false,
        errors: [
          {
            field: '_general',
            message: 'Validation failed',
            type: 'server',
          },
          {
            field: 'name',
            message: 'Name is required',
            type: 'server',
          },
        ],
      });
    });

    it('should handle network errors', async () => {
      const saveOperation: SaveOperation = {
        rowId: '456',
        isNew: false,
        data: { id: '456', name: 'Updated Name' },
        originalData: { id: '456', name: 'Original Name' },
      };

      mockMetadata.datasourceServletClient.request.mockRejectedValue(new Error('Network error'));

      const result = await saveRecord({
        saveOperation,
        tab: mockTab,
        userId: mockUserId,
      });

      expect(result).toEqual({
        success: false,
        errors: [
          {
            field: '_general',
            message: 'Network error',
            type: 'server',
          },
        ],
      });
    });

    it('should handle abort signal', async () => {
      const saveOperation: SaveOperation = {
        rowId: '456',
        isNew: false,
        data: { id: '456', name: 'Updated Name' },
        originalData: { id: '456', name: 'Original Name' },
      };

      const abortController = new AbortController();
      abortController.abort();

      mockMetadata.datasourceServletClient.request.mockRejectedValue(new Error('Request aborted'));

      const result = await saveRecord({
        saveOperation,
        tab: mockTab,
        userId: mockUserId,
        signal: abortController.signal,
      });

      expect(result).toEqual({
        success: false,
        errors: [
          {
            field: '_general',
            message: 'Request aborted',
            type: 'server',
          },
        ],
      });
    });
  });

  describe('processSaveErrors', () => {
    it('should process field-specific errors', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required', type: 'server' },
        { field: 'email', message: 'Invalid email format', type: 'server' },
        { field: '_general', message: 'General error', type: 'server' },
      ];

      const result = processSaveErrors(errors);

      expect(result).toEqual({
        name: 'Name is required',
        email: 'Invalid email format',
      });
    });

    it('should handle empty errors array', () => {
      const result = processSaveErrors([]);
      expect(result).toEqual({});
    });
  });

  describe('getGeneralErrorMessage', () => {
    it('should return general error message', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required', type: 'server' },
        { field: '_general', message: 'General error', type: 'server' },
      ];

      const result = getGeneralErrorMessage(errors);
      expect(result).toBe('General error');
    });

    it('should return undefined when no general error', () => {
      const errors: ValidationError[] = [
        { field: 'name', message: 'Name is required', type: 'server' },
      ];

      const result = getGeneralErrorMessage(errors);
      expect(result).toBeUndefined();
    });

    it('should handle empty errors array', () => {
      const result = getGeneralErrorMessage([]);
      expect(result).toBeUndefined();
    });
  });

  describe('New Row Creation', () => {
    describe('createNewRecord', () => {
      it('should create new record successfully', async () => {
        const saveOperation: SaveOperation = {
          rowId: 'new_123',
          isNew: true,
          data: { id: 'new_123', name: 'New Record', email: 'test@example.com' },
        };

        const mockResponse = {
          ok: true,
          data: {
            response: {
              status: 0,
              data: [{ id: '789', name: 'New Record', email: 'test@example.com' }],
            },
          },
        };

        mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

        const result = await createNewRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        });

        expect(result).toEqual({
          success: true,
          data: { id: '789', name: 'New Record', email: 'test@example.com' },
        });

        // Verify the request was made with correct parameters for new record
        expect(mockMetadata.datasourceServletClient.request).toHaveBeenCalledWith(
          'TestEntity?mocked-query-string',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              operationType: 'add',
              data: expect.objectContaining({
                name: 'New Record',
                email: 'test@example.com',
              }),
            }),
          })
        );
      });

      it('should throw error when called with existing record', async () => {
        const saveOperation: SaveOperation = {
          rowId: '456',
          isNew: false,
          data: { id: '456', name: 'Existing Record' },
          originalData: { id: '456', name: 'Original Name' },
        };

        await expect(createNewRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        })).rejects.toThrow('createNewRecord should only be called for new records');
      });

      it('should handle validation errors for new record', async () => {
        const saveOperation: SaveOperation = {
          rowId: 'new_123',
          isNew: true,
          data: { id: 'new_123', name: '', email: '' }, // Invalid data
        };

        const mockResponse = {
          ok: false,
          data: {
            response: {
              status: 1,
              error: {
                message: 'Validation failed',
                fieldErrors: {
                  name: 'Name is required',
                  email: 'Email is required',
                },
              },
            },
          },
        };

        mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

        const result = await createNewRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        });

        expect(result).toEqual({
          success: false,
          errors: [
            {
              field: '_general',
              message: 'Validation failed',
              type: 'server',
            },
            {
              field: 'name',
              message: 'Name is required',
              type: 'server',
            },
            {
              field: 'email',
              message: 'Email is required',
              type: 'server',
            },
          ],
        });
      });

      it('should handle network errors for new record creation', async () => {
        const saveOperation: SaveOperation = {
          rowId: 'new_123',
          isNew: true,
          data: { id: 'new_123', name: 'New Record' },
        };

        mockMetadata.datasourceServletClient.request.mockRejectedValue(new Error('Network timeout'));

        const result = await createNewRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        });

        expect(result).toEqual({
          success: false,
          errors: [
            {
              field: '_general',
              message: 'Network timeout',
              type: 'server',
            },
          ],
        });
      });
    });

    describe('updateExistingRecord', () => {
      it('should update existing record successfully', async () => {
        const saveOperation: SaveOperation = {
          rowId: '456',
          isNew: false,
          data: { id: '456', name: 'Updated Name' },
          originalData: { id: '456', name: 'Original Name' },
        };

        const mockResponse = {
          ok: true,
          data: {
            response: {
              status: 0,
              data: [{ id: '456', name: 'Updated Name' }],
            },
          },
        };

        mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

        const result = await updateExistingRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        });

        expect(result).toEqual({
          success: true,
          data: { id: '456', name: 'Updated Name' },
        });

        // Verify the request was made with correct parameters for existing record
        expect(mockMetadata.datasourceServletClient.request).toHaveBeenCalledWith(
          'TestEntity?mocked-query-string',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              operationType: 'update',
              oldValues: { id: '456', name: 'Original Name' },
            }),
          })
        );
      });

      it('should throw error when called with new record', async () => {
        const saveOperation: SaveOperation = {
          rowId: 'new_123',
          isNew: true,
          data: { id: 'new_123', name: 'New Record' },
        };

        await expect(updateExistingRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        })).rejects.toThrow('updateExistingRecord should only be called for existing records');
      });
    });

    describe('New Row Integration Tests', () => {
      it('should handle complete new row creation workflow', async () => {
        // Step 1: Create save operation for new row
        const editingRowData: EditingRowData = {
          originalData: { id: 'new_123' },
          modifiedData: { 
            id: 'new_123',
            name: 'John Doe', 
            email: 'john@example.com',
            active: true
          },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        };

        const saveOperation = createSaveOperation('new_123', editingRowData);

        // Verify save operation is created correctly for new row
        expect(saveOperation).toEqual({
          rowId: 'new_123',
          isNew: true,
          data: { 
            id: 'new_123',
            name: 'John Doe', 
            email: 'john@example.com',
            active: true
          },
          originalData: undefined,
        });

        // Step 2: Mock successful server response
        const mockResponse = {
          ok: true,
          data: {
            response: {
              status: 0,
              data: [{ 
                id: '789', 
                name: 'John Doe', 
                email: 'john@example.com',
                active: true,
                creationDate: '2023-12-01T10:00:00Z',
                createdBy: 'test-user'
              }],
            },
          },
        };

        mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

        // Step 3: Create the new record
        const result = await createNewRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        });

        // Step 4: Verify successful creation
        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          id: '789',
          name: 'John Doe',
          email: 'john@example.com',
          active: true,
          creationDate: '2023-12-01T10:00:00Z',
          createdBy: 'test-user'
        });

        // Step 5: Verify the request was made correctly
        expect(mockMetadata.datasourceServletClient.request).toHaveBeenCalledWith(
          'TestEntity?mocked-query-string',
          expect.objectContaining({
            method: 'POST',
            body: expect.objectContaining({
              operationType: 'add',
              data: expect.objectContaining({
                name: 'John Doe',
                email: 'john@example.com',
                active: true,
              }),
            }),
          })
        );
      });

      it('should handle new row creation with validation failures', async () => {
        // Create save operation for new row with invalid data
        const editingRowData: EditingRowData = {
          originalData: { id: 'new_123' },
          modifiedData: { 
            id: 'new_123',
            name: '', // Invalid: empty required field
            email: 'invalid-email', // Invalid: bad email format
          },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        };

        const saveOperation = createSaveOperation('new_123', editingRowData);

        // Mock server validation error response
        const mockResponse = {
          ok: false,
          data: {
            response: {
              status: 1,
              error: {
                message: 'Validation failed',
                fieldErrors: {
                  name: 'Name is required',
                  email: 'Invalid email format',
                },
              },
            },
          },
        };

        mockMetadata.datasourceServletClient.request.mockResolvedValue(mockResponse);

        // Attempt to create the new record
        const result = await createNewRecord({
          saveOperation,
          tab: mockTab,
          userId: mockUserId,
        });

        // Verify the failure response
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(3); // General + 2 field errors

        // Process errors for state management
        const fieldErrors = processSaveErrors(result.errors!);
        expect(fieldErrors).toEqual({
          name: 'Name is required',
          email: 'Invalid email format',
        });

        const generalError = getGeneralErrorMessage(result.errors!);
        expect(generalError).toBe('Validation failed');
      });
    });
  });
});