import type { Field } from "@workspaceui/etendohookbinder/src/api/types";
import StatusBarField from "./StatusBarField";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { useToolbarContext } from "@/contexts/ToolbarContext";

export default function StatusBar({ fields }: { fields: Record<string, Field> }) {
  const { t } = useTranslation();
  const { onBack } = useToolbarContext();

  const handleCloseRecord = () => {
    onBack();
  };

  return (
    <div className="h-min flex gap-4 items-center justify-between bg-gray-100/50 shadow text-sm px-4 py-3 rounded-xl">
      <div>
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
