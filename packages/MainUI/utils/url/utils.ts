import { TAB_MODES } from "@/utils/url/constants";

export const isFormView = ({
  currentMode,
  recordId,
  parentHasSelectionInURL,
}: { currentMode: string; recordId: string; parentHasSelectionInURL: boolean }) => {
  return currentMode === TAB_MODES.FORM && !!recordId && parentHasSelectionInURL;
};
