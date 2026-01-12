import { useState, useEffect, useCallback, useRef } from "react";
import { executeLogic, type PayScriptRules, type ExecutionResult, type Validation } from "../engine/LogicEngine";

export interface UsePayScriptEngineOptions {
  autoExecute?: boolean;
  debounceMs?: number;
  onSuccess?: (result: ExecutionResult) => void;
  onError?: (error: string) => void;
}

export interface UsePayScriptEngineReturn {
  result: ExecutionResult | null;
  isExecuting: boolean;
  error: string | null;
  execute: () => ExecutionResult | null;
  // biome-ignore lint/suspicious/noExplicitAny: Generic computed values from PayScript rules
  computed: any;
  validations: Validation[];
  hasErrors: boolean;
}

/**
 * Hook to execute PayScript DSL in React components
 *
 * @param {Object} rules - The DSL rules (e.g., AddPaymentRules)
 * @param {Object} context - The current context/state of the process
 * @param {Object} options - Configuration options
 * @returns {Object} - Execution result and control functions
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic context for PayScript execution
export const usePayScriptEngine = (
  rules: PayScriptRules | null,
  context: any,
  options: UsePayScriptEngineOptions = {}
): UsePayScriptEngineReturn => {
  const { autoExecute = true, debounceMs = 300, onSuccess, onError } = options;

  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback((): ExecutionResult | null => {
    if (!rules) {
      console.warn("[PayScript] No rules provided");
      return null;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const output = executeLogic(rules, context);

      if (output.success) {
        setResult(output);
        onSuccess?.(output);
      } else {
        setError(output.error || "Unknown error");
        onError?.(output.error || "Unknown error");
      }

      return output;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsExecuting(false);
    }
  }, [rules, context, onSuccess, onError]);

  // Auto-execute with debounce when context changes
  useEffect(() => {
    if (!autoExecute) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Execute after debounce
    timeoutRef.current = setTimeout(() => {
      execute();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoExecute, debounceMs, execute]);

  return {
    result,
    isExecuting,
    error,
    execute,
    computed: result?.computed || {},
    validations: result?.validations || [],
    hasErrors: result?.validations?.some((v) => !v.isValid) || false,
  };
};
