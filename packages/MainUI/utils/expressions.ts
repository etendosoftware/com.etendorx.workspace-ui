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

/**
 * Public entry point of the expression evaluation context builder.
 *
 * The implementation lives in `utils/evaluation/buildEvaluationContext`. These names stay the import
 * path for application code and for test mocks (`jest.mock("@/utils/expressions")`).
 */
import { buildEvaluationContext } from "./evaluation/buildEvaluationContext";

export type {
  EvaluationContext,
  EvaluationContextOptions,
  EvaluationContextOptions as SmartContextOptions,
} from "./evaluation/buildEvaluationContext";

export const createEvaluationContext = buildEvaluationContext;
export const createSmartContext = buildEvaluationContext;
