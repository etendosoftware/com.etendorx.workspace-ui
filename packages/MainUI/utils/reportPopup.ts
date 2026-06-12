import { toast } from "sonner";

export const REPORT_POPUP_FEATURES = "width=950,height=700";
export const REPORT_POPUP_TARGET = "_blank";

export interface ReportPopupBlockedTexts {
  title: string;
  openLabel: string;
}

/**
 * Opens a popup window for a report URL. Returns whether the browser actually
 * granted the popup; callers use the result to fall back to a manual CTA when
 * the user agent (Safari, Chrome with popups disabled) blocks the call.
 */
export const tryOpenReportPopup = (popupUrl: string): boolean => {
  const popup = window.open(popupUrl, REPORT_POPUP_TARGET, REPORT_POPUP_FEATURES);
  if (!popup) {
    return false;
  }
  return !popup.closed;
};

/**
 * Surfaces a sonner toast informing the user that the browser blocked the
 * report popup, with an action button that retries the open call from a fresh
 * user gesture. Used by the Sidebar (where there is no enclosing modal to host
 * an inline CTA banner).
 */
export const notifyReportPopupBlocked = (retry: () => void, texts: ReportPopupBlockedTexts): void => {
  toast.warning(texts.title, {
    action: { label: texts.openLabel, onClick: retry },
  });
};
