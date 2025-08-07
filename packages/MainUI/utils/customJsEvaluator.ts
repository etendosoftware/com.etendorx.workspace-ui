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

import { executeStringFunction } from './functions';
import type { Column } from '@workspaceui/api-client/src/api/types';

export interface CustomJsContext {
  record: Record<string, unknown>;
  column: Column;
}

export async function evaluateCustomJs(
  jsCode: string,
  context: CustomJsContext
): Promise<unknown> {
  try {
    const evalContext = {
      record: context.record,
      column: context.column,
    };

    return await executeStringFunction(jsCode, evalContext, context.record);
  } catch (error) {
    console.error('Error evaluating custom JS:', error);
    // Fallback: show original value or placeholder
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `[Error: ${errorMessage}]`;
  }
}
