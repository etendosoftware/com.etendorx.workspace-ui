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

import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";

// Mock the language context to avoid Provider issues
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({
    language: "en_US",
  }),
}));

export interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
}

export const TestWrapper = ({ children, defaultValues = {} }: TestWrapperProps) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

export const createMockField = (reference: string, hqlName: string = "testField"): Field => ({
  hqlName,
  id: "test-field",
  name: "Test Field",
  column: {
    reference,
  },
  isMandatory: false,
} as Field);

export const FIELD_REFERENCES = {
  DECIMAL: "800008",
  INTEGER: "11", 
  QUANTITY_22: "22",
} as const;