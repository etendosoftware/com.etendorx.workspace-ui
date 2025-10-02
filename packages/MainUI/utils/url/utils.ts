import { TAB_MODES } from "@/utils/url/constants";

export const isFormView = ({ currentMode, recordId }: { currentMode: string; recordId: string }) => {
  return currentMode === TAB_MODES.FORM && !!recordId;
};
