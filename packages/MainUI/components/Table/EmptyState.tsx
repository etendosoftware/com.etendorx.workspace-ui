import { useTranslation } from "@/hooks/useTranslation";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_TableInstance } from "material-react-table";

const EmptyState = ({ table, maxWidth }: { table?: MRT_TableInstance<EntityData>; maxWidth?: number }) => {
  const { t } = useTranslation();
  maxWidth = table?.refs.tableContainerRef.current?.clientWidth ?? maxWidth;

  return (
    <span className="text-center py-8" style={{ maxWidth }}>
      <div className="w-16 h-8 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("table.labels.emptyRecords")}</h3>
      <p className="text-sm text-gray-500 mb-4">{t("status.noRecords")}</p>
    </span>
  );
};

export default EmptyState;
