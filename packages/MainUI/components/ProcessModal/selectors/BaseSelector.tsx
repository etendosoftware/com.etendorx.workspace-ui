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

import Label from "@/components/Label";
import GenericSelector from "./GenericSelector";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { useUserContext } from "@/hooks/useUserContext";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useForm } from "react-hook-form";
import { logger } from "@/utils/logger";

const BaseSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const { session } = useUserContext();
  const { getValues } = useForm();

  const isReadOnly = useMemo(() => {
    if (!parameter.readOnlyLogicExpression) return false;
    const compiledExpr = compileExpression(parameter.readOnlyLogicExpression);

    try {
      return compiledExpr(session, getValues());
    } catch (error) {
      logger.warn("Error executing expression:", compiledExpr, error);

      return true;
    }
  }, [getValues, parameter.readOnlyLogicExpression, session]);

  return (
    <div className="flex flex-col gap-4 items-start justify-start" title={"description"}>
      <div className="relative pr-2">
        {parameter.mandatory && (
          <span className="absolute -top-1 right-0 text-[#DC143C] font-bold" aria-required>
            *
          </span>
        )}
        <Label htmlFor={parameter.dBColumnName} name={parameter.name} />
      </div>
      <div className="w-full pb-8">
        <GenericSelector parameter={parameter} readOnly={isReadOnly} />
      </div>
    </div>
  );
};

export default BaseSelector;
