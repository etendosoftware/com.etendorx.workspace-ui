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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import CustomModal from "@workspaceui/componentlibrary/src/components/Modal/CustomModal";
import { LEGACY_ACTIONS, LEGACY_MESSAGE_TYPE } from "@/components/ProcessModal/legacyMessageProtocol";
import { useTranslation } from "@/hooks/useTranslation";

export interface AuditTrailModalProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
}

/**
 * Hosts the classic Audit Trail popup (`AuditTrailPopup`) in an iframe. The popup keeps its
 * own filters, history grid and deleted-records view; this modal only reacts to the messages
 * it posts: its Close button (`closeModal`) and a failed legacy request (`requestFailed`).
 * Navigation messages (`iframeUnloaded`, `processOrder`) are ignored on purpose.
 */
const AuditTrailModal = ({ isOpen, url, onClose }: AuditTrailModalProps) => {
  const { t } = useTranslation();
  const [iframeLoading, setIframeLoading] = useState(true);

  // Every new popup URL starts loading again; closing resets it to an empty string.
  useEffect(() => {
    if (url) {
      setIframeLoading(true);
    }
  }, [url]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== LEGACY_MESSAGE_TYPE) return;
      if (event.data.action === LEGACY_ACTIONS.CLOSE_MODAL) {
        onClose();
        return;
      }
      if (event.data.action === LEGACY_ACTIONS.REQUEST_FAILED) {
        toast.error(t("auditTrail.requestFailed"));
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, onClose, t]);

  const handleIframeLoad = useCallback(() => setIframeLoading(false), []);

  return (
    <CustomModal
      isOpen={isOpen}
      title={t("auditTrail.title")}
      iframeLoading={iframeLoading}
      url={url}
      handleIframeLoad={handleIframeLoad}
      handleClose={onClose}
      texts={{
        loading: t("auditTrail.loading"),
        iframeTitle: t("auditTrail.iframeTitle"),
        noData: t("common.noDataAvailable"),
        closeButton: t("auditTrail.close"),
      }}
      data-testid="CustomModal__auditTrail"
    />
  );
};

export default AuditTrailModal;
