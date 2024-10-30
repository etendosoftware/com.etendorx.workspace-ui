import { useCallback, useState } from 'react';

const useLocalStorage = (key: string, initialValue: unknown) => {
  const [state, setState] = useState(() => {
    // Initialize the state
    try {
      const value = window.localStorage.getItem(key);
      // Check if the local storage already has any values,
      // otherwise initialize it with the passed initialValue
      return value ? JSON.parse(value) : initialValue;
    } catch (error) {
      console.log(error);
    }
  });

  const setValue = useCallback(
    (value: unknown) => {
      try {
        const valueToStore = value instanceof Function ? value(state) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setState(value);
      } catch (error) {
        console.log(error);
      }
    },
    [key, state],
  );

  return [state, setValue];
};

export default useLocalStorage;
   
