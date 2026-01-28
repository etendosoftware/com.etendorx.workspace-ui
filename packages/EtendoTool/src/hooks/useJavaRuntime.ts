import { useCallback, useEffect, useState } from "react";
import { checkJavaCommand, executeJavaCommand } from "../api/javaRuntime";
import type { JavaRuntimeStatus, JavaRuntimeViewState } from "../types/javaRuntime";

const INITIAL_STATE: JavaRuntimeViewState = {
  status: "unknown",
  available: false,
  message: "Runtime has not been checked yet.",
};

export function useJavaRuntime() {
  const [state, setState] = useState<JavaRuntimeViewState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await checkJavaCommand();
      const status: JavaRuntimeStatus = response.available ? "installed" : "missing";
      setState({
        status,
        available: response.available,
        message: response.available
          ? "Java is available on the host."
          : "Java is not available; run the installation.",
        lastCheckedAt: new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error while checking the installation.");
    } finally {
      setLoading(false);
    }
  }, []);

  const runJava = useCallback(async () => {
    setLoading(true);
    try {
      const response = await executeJavaCommand();
      setState({
        status: response.success ? "installed" : "installing",
        available: response.success,
        message: response.success
          ? "Java responded correctly."
          : response.error ?? "Could not run Java; check the output.",
        output: response.output || response.error,
        success: response.success,
        lastRunAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the Java 17 installation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const skipRequirements = useCallback(() => {
    setSkipped(true);
    setState((prev) => ({
      ...prev,
      available: true,
      status: "installed",
      skipped: true,
      message: "Requirements manually skipped.",
    }));
  }, []);

  return {
    state,
    loading,
    error,
    checkStatus,
    runJava,
    skipRequirements,
    skipped,
  };
}
