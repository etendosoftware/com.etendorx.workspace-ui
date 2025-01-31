import { useEffect } from 'react';

export default function useOBUtilities() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).OB = {
      Utilities: {
        getValue: (object: Record<string, never>, property: string) => {
          return object[property];
        },
      },
    };
  }, []);
}
