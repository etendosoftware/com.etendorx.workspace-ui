import { ApiContext } from "@/contexts/api";
import { useContext } from "react";

export const useApiContext = () => {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error("useApiContext must be used within an ApiProvider");
  }

  return context;
};
