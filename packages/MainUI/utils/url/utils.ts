import { TAB_MODES } from "@/utils/url/constants";

export const isFormView = ({
  currentMode,
  recordId,
  parentHasSelectionInURL,
}: { currentMode: string; recordId: string; parentHasSelectionInURL: boolean }) => {
  return currentMode === TAB_MODES.FORM && !!recordId && parentHasSelectionInURL;
};

export const getNewWindowIdentifier = (windowId: string) => {
  return `${windowId}_${Date.now()}`;
};
