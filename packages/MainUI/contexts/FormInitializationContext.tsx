/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { createContext, useContext, useCallback, useState } from "react";

interface FormInitializationContextType {
  isFormInitializing: boolean;
  isSettingInitialValues: boolean;
  setIsSettingInitialValues: (value: boolean) => void;
  markFormReady: () => void;
}

const FormInitializationContext = createContext<FormInitializationContextType | undefined>(undefined);

export const FormInitializationProvider = ({ 
  children, 
  value 
}: { 
  children: React.ReactNode;
  value: { isFormInitializing: boolean };
}) => {
  const [isSettingInitialValues, setIsSettingInitialValues] = useState(false);
  
  const markFormReady = useCallback(() => {
    setIsSettingInitialValues(false);
  }, []);

  const contextValue: FormInitializationContextType = {
    isFormInitializing: value.isFormInitializing,
    isSettingInitialValues,
    setIsSettingInitialValues,
    markFormReady,
  };

  return (
    <FormInitializationContext.Provider value={contextValue}>
      {children}
    </FormInitializationContext.Provider>
  );
};

export const useFormInitializationContext = () => {
  const context = useContext(FormInitializationContext);
  if (context === undefined) {
    return { 
      isFormInitializing: false, 
      isSettingInitialValues: false, 
      setIsSettingInitialValues: () => {},
      markFormReady: () => {}
    };
  }
  return context;
};
