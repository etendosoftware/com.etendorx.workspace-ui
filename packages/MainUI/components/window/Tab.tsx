"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/etendohookbinder/src/api/types";
import type { TabLevelProps } from "@/components/window/types";
import { useCallback, useEffect, useState } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useSelected } from "@/hooks/useSelected";
import { useWindowStateMemorization } from "@/hooks/navigation/useWindowStateMemorization";

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const [recordId, setRecordId] = useState<string>("");
  const { registerActions } = useToolbarContext();
  const { graph, setTabRecordId, getTabRecordId } = useSelected();
  const { memoizeRecordSelection, memoizeFormData, memoizeTableState } = useWindowStateMemorization();

  const handleSetRecordId = useCallback<React.Dispatch<React.SetStateAction<string>>>(
    (value) => {
      setRecordId((prev) => {
        const newValue = typeof value === "function" ? value(prev) : value;

        setTabRecordId(tab.id, newValue);

        // Memoizar la selección del record
        memoizeRecordSelection(newValue);

        return newValue;
      });
    },
    [tab.id, setTabRecordId, memoizeRecordSelection]
  );

  const handleFormDataChange = useCallback(
    (formData: Record<string, any>) => {
      memoizeFormData(formData);
    },
    [memoizeFormData]
  );

  const handleTableStateChange = useCallback(
    (tableState: {
      page?: number;
      sortBy?: string;
      filters?: Record<string, any>;
    }) => {
      memoizeTableState(tableState);
    },
    [memoizeTableState]
  );

  useEffect(() => {
    const globalRecordId = getTabRecordId(tab.id);
    if (globalRecordId !== recordId) {
      setRecordId(globalRecordId);
    }
  }, [tab.id, getTabRecordId, recordId]);

  useEffect(() => {
    registerActions({
      new: () => {
        handleSetRecordId("new");
        graph.clearSelected(tab);
      },
      back: () => {
        handleSetRecordId("");
        graph.clearSelected(tab);
      },
    });
  }, [registerActions, tab, handleSetRecordId, graph, recordId]);

  return (
    <div
      className={`bg-(linear-gradient(180deg, #C6CFFF 0%, #FCFCFD 55.65%)) border-t border-t-(--color-transparent-neutral-10) flex p-2  gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${collapsed ? "hidden" : "flex-1 h-full"}`}>
      <Toolbar windowId={window?.id || tab.window} tabId={tab.id} isFormView={!!recordId} />
      {recordId ? (
        <FormView
          mode={recordId === "new" ? FormMode.NEW : FormMode.EDIT}
          tab={tab}
          window={window}
          recordId={recordId}
          setRecordId={handleSetRecordId}
          onFormDataChange={handleFormDataChange}
        />
      ) : (
        <DynamicTable setRecordId={handleSetRecordId} onTableStateChange={handleTableStateChange} />
      )}
    </div>
  );
}

export default Tab;
