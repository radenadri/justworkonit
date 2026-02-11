import { useState, useCallback } from "react";

export function useCheckboxStorage(
  key: string,
  defaultValue: boolean,
): [boolean, (val: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // localStorage full or unavailable — silent fail
      }
    },
    [key],
  );

  return [value, setAndPersist];
}
