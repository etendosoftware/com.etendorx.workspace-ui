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

import React, { useState, useEffect } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_Cell, MRT_Row } from "material-react-table";
import { evaluateCustomJs } from "@/utils/customJsEvaluator";
import { isColorString } from "@/utils/color/utils";
import ColorCell from "@/components/Table/Cells/ColorCell";
import { logger } from "@/utils/logger";
import { CircularProgress } from "@mui/material";

const renderCellContent = (result: unknown): JSX.Element => {
  if (isColorString(result)) {
    return <ColorCell color={result as string} data-testid="ColorCell__af261f" />;
  }

  if (React.isValidElement(result)) {
    return result;
  }

  return <span>{String(result)}</span>;
};

interface CustomJsCellProps {
  cell: MRT_Cell<EntityData, unknown>;
  row: MRT_Row<EntityData>;
  customJsCode: string | null | undefined;
  column: Column;
}

export const CustomJsCell: React.FC<CustomJsCellProps> = React.memo(({ cell, row, customJsCode, column }) => {
  const [result, setResult] = useState<unknown>(cell.getValue());
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (!customJsCode || !customJsCode.trim()) return;
    const evaluateCode = async () => {
      setIsEvaluating(true);
      try {
        const evaluated = await evaluateCustomJs(customJsCode, {
          record: row.original,
          column,
        });
        setResult(evaluated);
      } catch (error) {
        logger.error("Custom JS evaluation failed:", error);
        setResult(cell.getValue()); // Fallback to original value
      } finally {
        setIsEvaluating(false);
      }
    };

    evaluateCode();
  }, [customJsCode, cell.getValue(), row.original, column]);

  if (isEvaluating) {
    return (
      <span className="w-full h-full flex justify-center items-center">
        <CircularProgress data-testid="CircularProgress__af261f" />
      </span>
    );
  }

  return renderCellContent(result);
});

CustomJsCell.displayName = "CustomJsCell";
