"use client";

import { createContext, useContext, useState } from "react";

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

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
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
