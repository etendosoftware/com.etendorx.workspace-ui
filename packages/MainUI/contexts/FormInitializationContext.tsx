import { createContext, useContext } from "react";

interface FormInitializationContextType {
  isFormInitializing: boolean;
}

const FormInitializationContext = createContext<FormInitializationContextType | undefined>(undefined);

export const FormInitializationProvider = FormInitializationContext.Provider;

export const useFormInitializationContext = () => {
  const context = useContext(FormInitializationContext);
  if (context === undefined) {
    return { isFormInitializing: false };
  }
  return context;
};
