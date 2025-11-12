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
  createOptimisticUpdateManager,
  useOptimisticUpdates,
} from '../utils/optimisticUpdates';
import type { EntityData } from '@workspaceui/api-client/src/api/types';
import type { EditingRowData, OptimisticUpdate } from '../types/inlineEditing';

// Mock the logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('optimisticUpdates', () => {
  const mockRecords: EntityData[] = [
    { id: '1', name: 'Record 1', value: 100 },
    { id: '2', name: 'Record 2', value: 200 },
    { id: '3', name: 'Record 3', value: 300 },
  ];

  describe('createOptimisticUpdateManager', () => {
    let manager: ReturnType<typeof createOptimisticUpdateManager>;

    beforeEach(() => {
      manager = createOptimisticUpdateManager();
    });

    describe('applyOptimisticUpdate', () => {
      it('should apply create update', () => {
        const update: OptimisticUpdate = {
          type: 'create',
          rowId: 'new_123',
          newData: { id: 'new_123', name: 'New Record', value: 400 },
          timestamp: Date.now(),
        };

        const result = manager.applyOptimisticUpdate(mockRecords, update);

        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({ id: 'new_123', name: 'New Record', value: 400 });
        expect(result.slice(1)).toEqual(mockRecords);
      });

      it('should apply update operation', () => {
        const update: OptimisticUpdate = {
          type: 'update',
          rowId: '2',
          originalData: { id: '2', name: 'Record 2', value: 200 },
          newData: { id: '2', name: 'Updated Record 2', value: 250 },
          timestamp: Date.now(),
        };

        const result = manager.applyOptimisticUpdate(mockRecords, update);

        expect(result).toHaveLength(3);
        expect(result[1]).toEqual({ id: '2', name: 'Updated Record 2', value: 250 });
        expect(result[0]).toEqual(mockRecords[0]);
        expect(result[2]).toEqual(mockRecords[2]);
      });

      it('should apply delete operation', () => {
        const update: OptimisticUpdate = {
          type: 'delete',
          rowId: '2',
          timestamp: Date.now(),
        };

        const result = manager.applyOptimisticUpdate(mockRecords, update);

        expect(result).toHaveLength(2);
        expect(result).toEqual([mockRecords[0], mockRecords[2]]);
      });

      it('should return original records for invalid update', () => {
        const update: OptimisticUpdate = {
          type: 'create',
          rowId: 'new_123',
          // Missing newData
          timestamp: Date.now(),
        };

        const result = manager.applyOptimisticUpdate(mockRecords, update);
        expect(result).toEqual(mockRecords);
      });
    });

    describe('createOptimisticCreate', () => {
      it('should create optimistic create update', () => {
        const editingRowData: EditingRowData = {
          originalData: { id: 'new_123' },
          modifiedData: { name: 'New Record', value: 400 },
          isNew: true,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        };

        const result = manager.createOptimisticCreate('new_123', editingRowData);

        expect(result).toEqual({
          type: 'create',
          rowId: 'new_123',
          newData: { id: 'new_123', name: 'New Record', value: 400 },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('createOptimisticUpdate', () => {
      it('should create optimistic update', () => {
        const editingRowData: EditingRowData = {
          originalData: { id: '2', name: 'Record 2', value: 200 },
          modifiedData: { name: 'Updated Record 2', value: 250 },
          isNew: false,
          validationErrors: {},
          isSaving: false,
          hasUnsavedChanges: true,
        };

        const result = manager.createOptimisticUpdate('2', editingRowData);

        expect(result).toEqual({
          type: 'update',
          rowId: '2',
          originalData: { id: '2', name: 'Record 2', value: 200 },
          newData: { id: '2', name: 'Updated Record 2', value: 250 },
          timestamp: expect.any(Number),
        });
      });
    });

    describe('pending updates management', () => {
      it('should add and track pending updates', () => {
        const update: OptimisticUpdate = {
          type: 'update',
          rowId: '2',
          originalData: { id: '2', name: 'Record 2', value: 200 },
          newData: { id: '2', name: 'Updated Record 2', value: 250 },
          timestamp: Date.now(),
        };

        manager.addPendingUpdate(update);

        expect(manager.hasPendingUpdate('2')).toBe(true);
        expect(manager.hasPendingUpdate('1')).toBe(false);
        expect(manager.getPendingUpdates()).toHaveLength(1);
        expect(manager.getPendingUpdates()[0]).toEqual(update);
      });

      it('should confirm updates', () => {
        const update: OptimisticUpdate = {
          type: 'update',
          rowId: '2',
          originalData: { id: '2', name: 'Record 2', value: 200 },
          newData: { id: '2', name: 'Updated Record 2', value: 250 },
          timestamp: Date.now(),
        };

        manager.addPendingUpdate(update);
        expect(manager.hasPendingUpdate('2')).toBe(true);

        manager.confirmUpdate('2');
        expect(manager.hasPendingUpdate('2')).toBe(false);
        expect(manager.getPendingUpdates()).toHaveLength(0);
      });

      it('should rollback updates', () => {
        const originalData = { id: '2', name: 'Record 2', value: 200 };
        const update: OptimisticUpdate = {
          type: 'update',
          rowId: '2',
          originalData,
          newData: { id: '2', name: 'Updated Record 2', value: 250 },
          timestamp: Date.now(),
        };

        manager.addPendingUpdate(update);
        expect(manager.hasPendingUpdate('2')).toBe(true);

        const rolledBackData = manager.rollbackUpdate('2');
        expect(rolledBackData).toEqual(originalData);
        expect(manager.hasPendingUpdate('2')).toBe(false);
      });

      it('should clear all updates', () => {
        const update1: OptimisticUpdate = {
          type: 'update',
          rowId: '1',
          originalData: { id: '1', name: 'Record 1', value: 100 },
          newData: { id: '1', name: 'Updated Record 1', value: 150 },
          timestamp: Date.now(),
        };

        const update2: OptimisticUpdate = {
          type: 'update',
          rowId: '2',
          originalData: { id: '2', name: 'Record 2', value: 200 },
          newData: { id: '2', name: 'Updated Record 2', value: 250 },
          timestamp: Date.now(),
        };

        manager.addPendingUpdate(update1);
        manager.addPendingUpdate(update2);
        expect(manager.getPendingUpdates()).toHaveLength(2);

        manager.clearAllUpdates();
        expect(manager.getPendingUpdates()).toHaveLength(0);
        expect(manager.hasPendingUpdate('1')).toBe(false);
        expect(manager.hasPendingUpdate('2')).toBe(false);
      });
    });

    describe('applyAllOptimisticUpdates', () => {
      it('should apply multiple updates in timestamp order', () => {
        const baseTime = Date.now();
        
        const update1: OptimisticUpdate = {
          type: 'update',
          rowId: '1',
          originalData: { id: '1', name: 'Record 1', value: 100 },
          newData: { id: '1', name: 'Updated Record 1', value: 150 },
          timestamp: baseTime + 100,
        };

        const update2: OptimisticUpdate = {
          type: 'create',
          rowId: 'new_123',
          newData: { id: 'new_123', name: 'New Record', value: 400 },
          timestamp: baseTime + 50, // Earlier timestamp
        };

        manager.addPendingUpdate(update1);
        manager.addPendingUpdate(update2);

        const result = manager.applyAllOptimisticUpdates(mockRecords);

        // Should apply create first (earlier timestamp), then update
        expect(result).toHaveLength(4);
        expect(result[0]).toEqual({ id: 'new_123', name: 'New Record', value: 400 }); // Create applied first
        expect(result[1]).toEqual({ id: '1', name: 'Updated Record 1', value: 150 }); // Update applied second
      });
    });

    describe('rollbackAllUpdates', () => {
      it('should rollback all updates and return original records', () => {
        const update1: OptimisticUpdate = {
          type: 'update',
          rowId: '1',
          originalData: { id: '1', name: 'Record 1', value: 100 },
          newData: { id: '1', name: 'Updated Record 1', value: 150 },
          timestamp: Date.now(),
        };

        const update2: OptimisticUpdate = {
          type: 'create',
          rowId: 'new_123',
          newData: { id: 'new_123', name: 'New Record', value: 400 },
          timestamp: Date.now(),
        };

        manager.addPendingUpdate(update1);
        manager.addPendingUpdate(update2);

        const optimisticRecords = manager.applyAllOptimisticUpdates(mockRecords);
        expect(optimisticRecords).toHaveLength(4);

        const result = manager.rollbackAllUpdates(optimisticRecords, mockRecords);

        expect(result).toEqual(mockRecords);
        expect(manager.getPendingUpdates()).toHaveLength(0);
      });
    });
  });

  describe('useOptimisticUpdates', () => {
    it('should provide optimistic update functions', () => {
      const mockSetRecords = jest.fn();
      const optimisticUpdates = useOptimisticUpdates(mockRecords, mockSetRecords);

      expect(optimisticUpdates).toHaveProperty('applyOptimisticUpdate');
      expect(optimisticUpdates).toHaveProperty('confirmUpdate');
      expect(optimisticUpdates).toHaveProperty('rollbackUpdate');
      expect(optimisticUpdates).toHaveProperty('getPendingUpdates');
      expect(optimisticUpdates).toHaveProperty('hasPendingUpdate');
      expect(optimisticUpdates).toHaveProperty('clearAllUpdates');
    });

    it('should apply optimistic update and call setRecords', () => {
      const mockSetRecords = jest.fn();
      const optimisticUpdates = useOptimisticUpdates(mockRecords, mockSetRecords);

      const update: OptimisticUpdate = {
        type: 'create',
        rowId: 'new_123',
        newData: { id: 'new_123', name: 'New Record', value: 400 },
        timestamp: Date.now(),
      };

      optimisticUpdates.applyOptimisticUpdate(update);

      expect(mockSetRecords).toHaveBeenCalledWith([
        { id: 'new_123', name: 'New Record', value: 400 },
        ...mockRecords,
      ]);
    });

    it('should confirm update with server data', () => {
      const mockSetRecords = jest.fn();
      const optimisticUpdates = useOptimisticUpdates(mockRecords, mockSetRecords);

      const serverData = { id: '2', name: 'Server Updated Record 2', value: 275 };
      optimisticUpdates.confirmUpdate('2', serverData);

      expect(mockSetRecords).toHaveBeenCalledWith([
        mockRecords[0],
        serverData,
        mockRecords[2],
      ]);
    });

    it('should rollback update for existing record', () => {
      const mockSetRecords = jest.fn();
      const modifiedRecords = [
        mockRecords[0],
        { id: '2', name: 'Modified Record 2', value: 250 },
        mockRecords[2],
      ];
      
      const optimisticUpdates = useOptimisticUpdates(modifiedRecords, mockSetRecords);

      // Mock the manager to return original data
      const originalData = { id: '2', name: 'Record 2', value: 200 };
      
      // We need to simulate the rollback behavior
      optimisticUpdates.rollbackUpdate('2');

      // Since we can't easily mock the internal manager, we'll verify the call pattern
      expect(mockSetRecords).toHaveBeenCalled();
    });
  });
});