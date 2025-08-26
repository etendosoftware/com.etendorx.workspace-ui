export function getEnvVar(key: string): string | undefined {
  try {
    const p: any = typeof process !== "undefined" ? process : undefined;
    return p?.env?.[key];
  } catch {
    return undefined;
  }
}

function isDebugEnabled(envKey: string, localStorageKey: string): boolean {
  const env = getEnvVar(`NEXT_PUBLIC_${envKey}`) ?? getEnvVar(envKey);
  if (typeof env === "string") {
    const v = env.toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  try {
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem(localStorageKey);
      if (ls) {
        const v = ls.toLowerCase();
        return v === "true" || v === "1";
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export function isDebugCallouts(): boolean {
  return isDebugEnabled("DEBUG_CALLOUTS", "DEBUG_CALLOUTS");
}

export function isDebugManualProcesses(): boolean {
  return isDebugEnabled("DEBUG_MANUAL_PROCESSES", "DEBUG_MANUAL_PROCESSES");
}

// Utility function to enable callout debugging from browser console
export function enableCalloutDebugging(): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("DEBUG_CALLOUTS", "true");
    console.log("🐛 Callout debugging enabled. Refresh the page to see callout logs.");
  }
}

// Utility function to disable callout debugging
export function disableCalloutDebugging(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("DEBUG_CALLOUTS");
    console.log("🐛 Callout debugging disabled.");
  }
}

// Make debugging functions available globally in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).enableCalloutDebugging = enableCalloutDebugging;
  (window as any).disableCalloutDebugging = disableCalloutDebugging;
}
