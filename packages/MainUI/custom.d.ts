declare global {
  interface Window {
    currentValues: Record<string, never>;
  }
}

export {};
