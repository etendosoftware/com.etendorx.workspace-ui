import { useCallback, useEffect, useState } from "react";
import { checkJavaCommand, executeJavaCommand } from "../api/javaRuntime";
import type { JavaRuntimeStatus, JavaRuntimeViewState } from "../types/javaRuntime";

const INITIAL_STATE: JavaRuntimeViewState = {
  status: "unknown",
  available: false,
  message: "Aun no se chequo el runtime.",
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
          ? "Java esta disponible en el host."
          : "Java no esta disponible, ejecuta la instalacion.",
        lastCheckedAt: new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al verificar la instalacion.");
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
          ? "Java respondio correctamente."
          : response.error ?? "No se pudo ejecutar Java, revisa el output.",
        output: response.output || response.error,
        success: response.success,
        lastRunAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la instalacion de Java 17.");
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
      message: "Requisitos salteados manualmente.",
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
