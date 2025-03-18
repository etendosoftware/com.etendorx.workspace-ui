import { useRef, useEffect } from 'react';

export const usePrevious = <T>(value: T, initialValue: T) => {
  const ref = useRef(initialValue);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};
