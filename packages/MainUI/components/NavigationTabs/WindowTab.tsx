import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import FolderIcon from "@workspaceui/componentlibrary/src/assets/icons/folder.svg";
import { useTranslation } from "@/hooks/useTranslation";

interface WindowTabProps {
  windowId: string;
  title: string;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  canClose?: boolean;
  icon?: React.ReactNode;
}

export default function WindowTab({ title, isActive, onActivate, onClose, canClose = true }: WindowTabProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`
        h-9 flex gap-2 items-center justify-center p-2 cursor-pointer max-w-[220px] 
        relative group transition-all duration-200 text-(--color-baseline-90) 
        ${
          isActive
            ? "bg-(--color-baseline-0) border-b-2 border-(--color-dynamic-main)"
            : "hover:bg-(--color-baseline-0)"
        }
      `}
      style={{
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
      }}
      onClick={onActivate}>
      <div className="h-full flex items-center flex-1 truncate gap-1">
        <FolderIcon className="fill-black" />
        <span className="flex-1 truncate text-sm font-medium" title={title}>
          {title}
        </span>
      </div>
      {canClose && (
        <button
          type="button"
          className={`
            w-5 h-5 flex-shrink-0 rounded-full transition-opacity duration-200
            hover:bg-gray-300 hover:text-gray-800 flex items-center justify-center
          `}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title={t("primaryTabs.closeWindow")}>
          <CloseIcon />
        </button>
      )}
    </button>
  );
}
