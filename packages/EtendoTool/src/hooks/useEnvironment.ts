import { useState, useEffect, useCallback } from "react";
import { getEnvironmentInfo } from "../api/environment";
import type { EnvironmentInfo } from "../types/environment";

interface UseEnvironmentResult {
  environment: EnvironmentInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DEFAULT_ENVIRONMENT: EnvironmentInfo = {
  type: "unknown",
  isDevContainer: false,
  dockerAvailable: false,
  dockerRunning: false,
};

export function useEnvironment(): UseEnvironmentResult {
  const [environment, setEnvironment] = useState<EnvironmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvironment = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getEnvironmentInfo();
      if (response.success && response.data) {
        setEnvironment(response.data);
      } else {
        setEnvironment(DEFAULT_ENVIRONMENT);
        setError(response.error || "Failed to detect environment");
      }
    } catch (err) {
      setEnvironment(DEFAULT_ENVIRONMENT);
      setError(err instanceof Error ? err.message : "Failed to detect environment");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironment();
  }, [fetchEnvironment]);

  return {
    environment,
    isLoading,
    error,
    refresh: fetchEnvironment,
  };
}
