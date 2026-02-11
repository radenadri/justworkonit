import { createContext, useContext, useRef, type ReactNode } from "react";

interface ProgressContextValue {
  docKey: string;
  getNextIndex: () => number;
}

const ProgressContext = createContext<ProgressContextValue>({
  docKey: "",
  getNextIndex: () => 0,
});

export function useProgress() {
  return useContext(ProgressContext);
}

export function ProgressProvider({
  docKey,
  children,
}: {
  docKey: string;
  children: ReactNode;
}) {
  const indexRef = useRef(0);

  // Reset counter on each render cycle (new page)
  indexRef.current = 0;

  const getNextIndex = () => {
    return indexRef.current++;
  };

  return (
    <ProgressContext value={{ docKey, getNextIndex }}>
      {children}
    </ProgressContext>
  );
}
