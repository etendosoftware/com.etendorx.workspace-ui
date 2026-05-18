import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { extractDependenciesFromExpression } from "@/utils/expressions/dependencies";
import { useTabContext } from "@/contexts/tab";

/**
 * Parses an Etendo expression and selectively subscribes to the required form fields.
 * This prevents O(N^2) global re-renders that happen when using watch() without arguments.
 *
 * @param expression The expression to analyze (usually displayLogic or readOnlyLogic)
 * @returns A record of observed values mapped by their field names, useful for injecting into evaluation contexts.
 */
export function useExpressionDependencies(expression?: string): Record<string, unknown> {
  const { tab } = useTabContext();

  // Memoize dependency extraction so we don't run regex on every render
  const dependencies = useMemo(() => {
    return extractDependenciesFromExpression(expression, tab?.fields);
  }, [expression, tab?.fields]);

  // Tell react-hook-form to only re-render this component when these specific fields change
  const watchedValuesArray = useWatch({
    name: dependencies,
  });

  // Re-map the array output from useWatch back into an object format
  const mappedValues = useMemo(() => {
    const result: Record<string, unknown> = {};
    if (dependencies && watchedValuesArray) {
      dependencies.forEach((depName, index) => {
        result[depName] = watchedValuesArray[index];
      });
    }
    return result;
  }, [dependencies, watchedValuesArray]);

  return mappedValues;
}
