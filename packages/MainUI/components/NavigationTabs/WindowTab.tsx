import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
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

export default function WindowTab({
  title,
  isActive,
  onActivate,
  onClose,
  canClose = true,
}: WindowTabProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`
        flex gap-2 px-2 py-2 cursor-pointer
        min-w-[140px] max-w-[220px] relative group
        transition-all duration-200
        ${
          isActive
            ? "bg-white text-(--color-baseline-90) border-b-2 border-(--color-dynamic-main)"
            : " text-gray-700 hover:bg-gray-200 border-b-2 border-transparent hover:border-gray-300"
        }
      `}
      style={{
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
      }}
      onClick={onActivate}
    >
      <span className="flex-1 truncate text-sm font-medium" title={title}>
        {title}
      </span>
      {canClose && (
        <button
          type="button"
          className={`
            w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center transition-opacity duration-200
            hover:bg-gray-300 hover:text-gray-800
          `}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title={t("primaryTabs.closeWindow")}
        >
          <CloseIcon />
        </button>
      )}
    </button>
  );
}
