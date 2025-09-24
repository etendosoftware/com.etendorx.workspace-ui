/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

interface CustomModalProps {
  isOpen: boolean;
  title: string;
  iframeLoading: boolean;
  customContent?: React.ReactNode;
  url: string;
  handleIframeLoad?: () => void;
  handleClose: () => void;
  texts: {
    loading?: string;
    iframeTitle?: string;
    noData?: string;
    closeButton: string;
  };
  customContentClass?: string;
}

const CustomModal = ({
  isOpen,
  title,
  iframeLoading,
  customContent,
  url,
  handleIframeLoad,
  handleClose,
  texts,
  customContentClass,
}: CustomModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      {/* NOTE: sizes inherited from the modal for manual processes from the previous UI */}
      <div
        className={`relative flex h-[625px] w-[900px] flex-col rounded-xl border-4 border-gray-300 bg-white ${customContentClass}`}>
        <div className="flex items-center justify-between rounded-xl border-gray-200 border-b bg-[var(--color-baseline-10)] p-4">
          <h2 className="font-semibold text-lg">{title}</h2>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {iframeLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-etendo-main)] border-t-transparent" />
                <p className="mt-2 font-medium">{texts.loading}</p>
              </div>
            </div>
          )}
          {customContent}
          {!iframeLoading && !url && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <p className="text-2xl font-medium">{texts.noData}</p>
              </div>
            </div>
          )}
          <iframe src={url} onLoad={handleIframeLoad} className="h-full w-full border-0" title={texts.iframeTitle} />
        </div>
        <div className="flex justify-end rounded-xl border-gray-200 border-t bg-[var(--color-baseline-10)] p-4">
          <button
            data-testid="close-button"
            type="button"
            onClick={handleClose}
            className="mx-auto rounded bg-[var(--color-etendo-main)] px-4 py-2 font-medium text-white hover:bg-[var(--color-etendo-dark)] focus:outline-none">
            {texts.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
