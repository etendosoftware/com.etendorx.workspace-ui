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

import { createContext, useContext, type ReactNode } from "react";

interface WindowReferenceGridContextValue {
  // Use Refs for dynamic data to prevent context updates from triggering re-renders
  // biome-ignore lint/suspicious/noExplicitAny: generic data
  effectiveRecordValuesRef: React.MutableRefObject<any>;
  // biome-ignore lint/suspicious/noExplicitAny: generic data
  parametersRef: React.MutableRefObject<any>;
  // biome-ignore lint/suspicious/noExplicitAny: generic array of fields
  fieldsRef: React.MutableRefObject<any[]>;
  // biome-ignore lint/suspicious/noExplicitAny: handler function
  handleRecordChangeRef: React.MutableRefObject<((row: any, changes: any) => void) | null>;
  // biome-ignore lint/suspicious/noExplicitAny: validations array
  validationsRef: React.MutableRefObject<any[]>;
  // biome-ignore lint/suspicious/noExplicitAny: active validations to trigger updates
  validations: any[];
  // biome-ignore lint/suspicious/noExplicitAny: user session
  session: any;
  tabId: string | undefined;
}

const WindowReferenceGridContext = createContext<WindowReferenceGridContextValue | undefined>(undefined);

export const WindowReferenceGridProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: WindowReferenceGridContextValue;
}) => {
  return <WindowReferenceGridContext.Provider value={value}>{children}</WindowReferenceGridContext.Provider>;
};

export const useWindowReferenceGridContext = () => {
  const context = useContext(WindowReferenceGridContext);
  if (!context) {
    throw new Error("useWindowReferenceGridContext must be used within WindowReferenceGridProvider");
  }
  return context;
};
