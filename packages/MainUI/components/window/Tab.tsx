"use client";

import { Toolbar } from "../Toolbar/Toolbar";
import DynamicTable from "../Table";
import { useMetadataContext } from "../../hooks/useMetadataContext";
import { FormView } from "@/components/Form/FormView";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import type { TabLevelProps } from "@/components/window/types";
import { useEffect, useState } from "react";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import {useSelected} from '@/hooks/useSelected';

export function Tab({ tab, collapsed }: TabLevelProps) {
  const { window } = useMetadataContext();
  const [recordId, setRecordId] = useState<string>("");
  const { registerActions } = useToolbarContext();
  const { graph } = useSelected();

  useEffect(() => {
    registerActions({
      new: () => {
        setRecordId("new");
        graph.clearSelected(tab);
      },
    });
  }, [recordId, registerActions, tab]);

  return (
    <div
      className={`flex gap-2 max-w-auto overflow-hidden flex-col min-h-0 shadow-lg ${collapsed ? "hidden" : "flex-1 h-full"}`}>
      <Toolbar windowId={window?.id || tab.window} tabId={tab.id} isFormView={!!recordId} />
      {recordId ? (
        <FormView
          mode={recordId === "new" ? FormMode.NEW : FormMode.EDIT}
          tab={tab}
          window={window}
          recordId={recordId}
          setRecordId={setRecordId}
        />
      ) : (
        <DynamicTable setRecordId={setRecordId} />
      )}
    </div>
  );
}

export default Tab;
