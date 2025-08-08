export function getEnvVar(key: string): string | undefined {
  try {
    // eslint-disable-next-line no-undef
    const p: any = typeof process !== 'undefined' ? process : undefined;
    return p?.env?.[key];
  } catch {
    return undefined;
  }
}

export function isDebugCallouts(): boolean {
  const env = getEnvVar('NEXT_PUBLIC_DEBUG_CALLOUTS') ?? getEnvVar('DEBUG_CALLOUTS');
  if (typeof env === 'string') {
    const v = env.toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  try {
    if (typeof window !== 'undefined') {
      const ls = window.localStorage.getItem('DEBUG_CALLOUTS');
      if (ls) {
        const v = ls.toLowerCase();
        return v === 'true' || v === '1';
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export function isDebugManualProcesses(): boolean {
  const env = getEnvVar('NEXT_PUBLIC_DEBUG_MANUAL_PROCESSES') ?? getEnvVar('DEBUG_MANUAL_PROCESSES');
  if (typeof env === 'string') {
    const v = env.toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  try {
    if (typeof window !== 'undefined') {
      const ls = window.localStorage.getItem('DEBUG_MANUAL_PROCESSES');
      if (ls) {
        const v = ls.toLowerCase();
        return v === 'true' || v === '1';
      }
    }
  } catch {
    // ignore
  }
  return false;
}
