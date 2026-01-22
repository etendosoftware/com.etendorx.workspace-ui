import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import AlertIcon from "../../../ComponentLibrary/src/assets/icons/alert-circle.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import Button from "../../../ComponentLibrary/src/components/Button/Button";
import { useTranslation } from "@/hooks/useTranslation";

interface ProcessResultModalProps {
  open: boolean;
  success: boolean;
  message?: string | null;
  title?: string;
  onClose: () => void;
}

export default function ProcessResultModal({ open, success, message, title, onClose }: ProcessResultModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const defaultTitle = success ? t("process.completedSuccessfully") : t("process.processError");
  const displayTitle = title || defaultTitle;
  const displayText = message?.replace(/<br\s*\/?>/gi, "\n");

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
        <div
          className="rounded-2xl p-6 shadow-xl max-w-sm w-full relative"
          style={{ background: "linear-gradient(180deg, #BFFFBF 0%, #FCFCFD 45%)" }}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Close">
            <CloseIcon className="w-5 h-5" data-testid="SuccessCloseIcon" />
          </button>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center">
              <CheckIcon className="w-6 h-6 fill-(--color-success-main)" data-testid="SuccessCheckIcon" />
            </div>
            <div>
              <h4 className="font-medium text-xl text-center text-(--color-success-main)">{displayTitle}</h4>
              {displayText && displayText !== displayTitle && (
                <p className="text-sm text-center text-(--color-transparent-neutral-80) whitespace-pre-line">
                  {displayText}
                </p>
              )}
            </div>
            <Button
              variant="filled"
              size="large"
              onClick={onClose}
              className="w-49"
              data-testid="SuccessCloseButton__761503">
              {t("common.close")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
      <div className="rounded-2xl p-6 shadow-xl max-w-sm w-full relative bg-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close">
          <CloseIcon className="w-5 h-5" data-testid="ErrorCloseIcon" />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center">
            <AlertIcon className="w-10 h-10 stroke-red-600" data-testid="ErrorAlertIcon" />
          </div>
          <div>
            <h4 className="font-medium text-xl text-center text-red-600">{displayTitle}</h4>
            {displayText && <p className="text-sm text-center text-gray-700 whitespace-pre-line">{displayText}</p>}
          </div>
          <Button variant="filled" size="large" onClick={onClose} className="w-49" data-testid="ErrorCloseButton">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
