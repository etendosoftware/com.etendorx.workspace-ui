export function getEnvVar(key: string): string | undefined {
  try {
     
    const p: any = typeof process !== 'undefined' ? process : undefined;
    return p?.env?.[key];
  } catch {
    return undefined;
  }
}

// Preference: how linked labels should open the target
// Values: 'form' | 'table'
export function getLinkedLabelOpenMode(): 'form' | 'table' {
  // Env first
  const env = getEnvVar('NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE') ?? getEnvVar('LINKED_LABEL_OPEN_MODE');
  if (typeof env === 'string') {
    const v = env.toLowerCase();
    if (v === 'form' || v === 'table') return v;
  }

  // Then localStorage
  try {
    if (typeof window !== 'undefined') {
      const ls = window.localStorage.getItem('LINKED_LABEL_OPEN_MODE');
      if (ls) {
        const v = ls.toLowerCase();
        if (v === 'form' || v === 'table') return v;
      }
    }
  } catch {}

  // Default
  return 'form';
}

export function isLinkedLabelOpenInForm(): boolean {
  return getLinkedLabelOpenMode() === 'form';
}

