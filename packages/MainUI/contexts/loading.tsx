"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";

type LoadingContextType = {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export default function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const value = useMemo<LoadingContextType>(
    () => ({ isLoading, showLoading, hideLoading }),
    [isLoading, showLoading, hideLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);

  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }

  return context;
};
