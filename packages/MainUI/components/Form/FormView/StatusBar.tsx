import type { Field } from "@workspaceui/api-client/src/api/types";
import StatusBarField from "./StatusBarField";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useEffect, useState } from "react";

export default function StatusBar({ fields }: { fields: Record<string, Field> }) {
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useTranslation();
  const { onBack, onSave } = useToolbarContext();

  const handleCloseRecord = async () => {
    try {
      await onSave();
      setIsSaved(true);
    } catch (error) {
      console.error("Error saving record", error);
    }
  };

  useEffect(() => {
    if (isSaved) {
      onBack();
    }

    return () => {
      setIsSaved(false);
    };
  }, [isSaved, onBack]);

  return (
    <div className="h-min flex items-center justify-between bg-gray-100/50 shadow px-4 py-3 rounded-xl">
      <div className="flex gap-4 text-sm">
        {Object.entries(fields).map(([key, field]) => (
          <StatusBarField key={key} field={field} />
        ))}
      </div>
      <IconButton
        onClick={handleCloseRecord}
        className="w-8 h-8"
        tooltip={t("forms.statusBar.closeRecord")}
        disabled={false}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}
