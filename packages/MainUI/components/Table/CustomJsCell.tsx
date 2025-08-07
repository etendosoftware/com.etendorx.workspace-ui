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

import React, { useState, useEffect } from 'react';
import type { Column } from '@workspaceui/api-client/src/api/types';
import type { EntityData } from '@workspaceui/api-client/src/api/types';
import type { MRT_Cell, MRT_Row } from 'material-react-table';
import { evaluateCustomJs } from '@/utils/customJsEvaluator';

interface CustomJsCellProps {
  cell: MRT_Cell<EntityData, unknown>;
  row: MRT_Row<EntityData>;
  customJsCode: string;
  column: Column;
}

export const CustomJsCell: React.FC<CustomJsCellProps> = React.memo(({
  cell,
  row,
  customJsCode,
  column
}) => {
  const [result, setResult] = useState<unknown>(cell.getValue());
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const evaluateCode = async () => {
      setIsEvaluating(true);
      try {
        const evaluated = await evaluateCustomJs(
          customJsCode,
          {
            record: row.original,
            column,
          }
        );
        setResult(evaluated);
      } catch (error) {
        console.error('Custom JS evaluation failed:', error);
        setResult(cell.getValue()); // Fallback to original value
      } finally {
        setIsEvaluating(false);
      }
    };

    evaluateCode();
  }, [customJsCode, cell.getValue(), row.original, column]);

  if (isEvaluating) {
    return <span className="text-gray-400">...</span>;
  }

  if (React.isValidElement(result)) {
    return result;
  }

  return <span>{String(result)}</span>;
});

CustomJsCell.displayName = 'CustomJsCell';
