import { renderHook } from '@testing-library/react';
import { useProcessInitialState, useProcessLogicFields, useProcessFilterExpressions } from '../useProcessInitialState';
import type { ProcessDefaultsResponse } from '@/components/ProcessModal/types/ProcessParameterExtensions';
import type { ProcessParameter } from '@workspaceui/api-client/src/api/types';
import { createMockParameters, createMockProcessDefaults } from "../../testUtils/processDefaults.fixtures";

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useProcessInitialState', () => {
  const mockParameters: ProcessParameter[] = createMockParameters();

  const mockProcessDefaults: ProcessDefaultsResponse = createMockProcessDefaults();

  describe('useProcessInitialState', () => {
    it('should return null when no process defaults provided', () => {
      const { result } = renderHook(() => 
        useProcessInitialState(null, mockParameters)
      );

      expect(result.current).toBeNull();
    });

    it('should return empty object when no defaults in process response', () => {
      const emptyDefaults: ProcessDefaultsResponse = {
        defaults: {},
        filterExpressions: {},
        refreshParent: false
      };

      const { result } = renderHook(() => 
        useProcessInitialState(emptyDefaults, mockParameters)
      );

      expect(result.current).toEqual({});
    });

    it('should process simple values correctly', () => {
      const { result } = renderHook(() => 
        useProcessInitialState(mockProcessDefaults, mockParameters)
      );

      const initialState = result.current;
      expect(initialState).not.toBeNull();
      expect(initialState!['trxtype']).toBe('');
      expect(initialState!['payment_documentno']).toBe('<1000373>');
      expect(initialState!['actual_payment']).toBe('1.85');
      expect(initialState!['issotrx']).toBe(true);
      expect(initialState!['StdPrecision']).toBe('2');
    });

    it('should process reference values correctly', () => {
      const { result } = renderHook(() => 
        useProcessInitialState(mockProcessDefaults, mockParameters)
      );

      const initialState = result.current;
      expect(initialState).not.toBeNull();
      expect(initialState!['ad_org_id']).toBe('E443A31992CB4635AFCAEABE7183CE85');
      expect(initialState!['ad_org_id$_identifier']).toBe('F&B España - Región Norte');
    });

    it('should skip logic fields', () => {
      const { result } = renderHook(() => 
        useProcessInitialState(mockProcessDefaults, mockParameters)
      );

      const initialState = result.current;
      expect(initialState).not.toBeNull();
      expect(initialState!['trxtype_display_logic']).toBeUndefined();
      expect(initialState!['ad_org_id_display_logic']).toBeUndefined();
      expect(initialState!['actual_payment_readonly_logic']).toBeUndefined();
    });

    it('should handle parameters without parameter mapping', () => {
      const { result } = renderHook(() => 
        useProcessInitialState(mockProcessDefaults, [])
      );

      const initialState = result.current;
      expect(initialState).not.toBeNull();
      // Should still process fields even without parameter mapping
      expect(initialState!['trxtype']).toBe('');
      expect(initialState!['ad_org_id']).toBe('E443A31992CB4635AFCAEABE7183CE85');
    });
  });

  describe('useProcessLogicFields', () => {
    it('should extract display logic fields', () => {
      const { result } = renderHook(() => 
        useProcessLogicFields(mockProcessDefaults)
      );

      const logicFields = result.current;
      expect(logicFields['trxtype.display']).toBe(false); // "N" -> false
      expect(logicFields['ad_org_id.display']).toBe(false); // "N" -> false
    });

    it('should extract readonly logic fields', () => {
      const { result } = renderHook(() => 
        useProcessLogicFields(mockProcessDefaults)
      );

      const logicFields = result.current;
      expect(logicFields['actual_payment.readonly']).toBe(false); // "N" -> false
      expect(logicFields['received_from.readonly']).toBe(true); // "Y" -> true
    });

    it('should return empty object when no defaults provided', () => {
      const { result } = renderHook(() => 
        useProcessLogicFields(null)
      );

      expect(result.current).toEqual({});
    });
  });

  describe('useProcessFilterExpressions', () => {
    it('should return filter expressions from response', () => {
      const { result } = renderHook(() => 
        useProcessFilterExpressions(mockProcessDefaults)
      );

      const filterExpressions = result.current;
      expect(filterExpressions).toEqual({
        "order_invoice": {
          "paymentMethodName": "Transferencia"
        },
        "glitem": {},
        "credit_to_use": {}
      });
    });

    it('should return empty object when no filter expressions', () => {
      const noFilters: ProcessDefaultsResponse = {
        defaults: {},
        filterExpressions: {},
        refreshParent: false
      };

      const { result } = renderHook(() => 
        useProcessFilterExpressions(noFilters)
      );

      expect(result.current).toEqual({});
    });

    it('should return empty object when no response provided', () => {
      const { result } = renderHook(() => 
        useProcessFilterExpressions(null)
      );

      expect(result.current).toEqual({});
    });
  });

  describe('Error handling', () => {
    it('should handle malformed field processing gracefully', () => {
      const malformedDefaults: ProcessDefaultsResponse = {
        defaults: {
          "normal_field": "normal_value",
          "broken_field": { value: 123 } as any, // Invalid reference object
        },
        filterExpressions: {},
        refreshParent: false
      };

      const { result } = renderHook(() => 
        useProcessInitialState(malformedDefaults, mockParameters)
      );

      const initialState = result.current;
      expect(initialState).not.toBeNull();
      expect(initialState!['normal_field']).toBe('normal_value');
      expect(initialState!['broken_field']).toBe('{"value":123}'); // Should stringify object
    });
  });
});
