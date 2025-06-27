import type { Field } from "@workspaceui/api-client/src/api/types";
import StatusBarField from "./StatusBarField";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { useToolbarContext } from "@/contexts/ToolbarContext";

export default function StatusBar({ fields }: { fields: Record<string, Field> }) {
  const { t } = useTranslation();
  const { onBack, onSave } = useToolbarContext();

  const handleCloseRecord = async () => {
    await onSave();
    // Delay navigation to ensure UI updates complete before redirecting
    setTimeout(() => {
      onBack();
    }, 100);
  };

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
