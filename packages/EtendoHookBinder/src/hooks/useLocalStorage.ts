import { useEffect, useRef, useState } from 'react';

const useLocalStorage = (key: string, initialValue: unknown) => {
  const ready = useRef(false);
  const [state, setState] = useState(() => {
    // Initialize the state
    try {
      const value = window.localStorage.getItem(key);
      // Check if the local storage already has any values,
      // otherwise initialize it with the passed initialValue
      return value ? JSON.parse(value) : initialValue;
    } catch (error) {
      console.log(error);

      return initialValue;
    }
  });

  useEffect(() => {
    const saveToStorage = () => {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn(e);
      }
    };

    if (ready.current) {
      saveToStorage();
    } else {
      ready.current = true;
    }
  }, [key, state]);

  return [state, setState];
};

export default useLocalStorage;
