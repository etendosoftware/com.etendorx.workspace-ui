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

import { useEffect, useState } from "react";
import PaperclipIcon from "../../../ComponentLibrary/src/assets/icons/paperclip.svg";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useAttachmentContext } from "@/contexts/AttachmentContext";
import { Badge } from "@mui/material";

interface AttachmentIndicatorProps {
  record: EntityData;
  tab: Tab;
  onClick?: () => void;
}

export const AttachmentIndicator = ({ record, tab, onClick }: AttachmentIndicatorProps) => {
  const { fetchAttachmentInfo } = useAttachmentContext();
  const [attachmentCount, setAttachmentCount] = useState<number>(0);
  const [hasAttachments, setHasAttachments] = useState<boolean>(false);

  useEffect(() => {
    const loadAttachmentInfo = async () => {
      const info = await fetchAttachmentInfo(record, tab);
      if (info) {
        setHasAttachments(info.attachmentExists);
        setAttachmentCount(info.attachmentCount);
      }
    };

    loadAttachmentInfo();
  }, [record, tab, fetchAttachmentInfo]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center min-w-6 min-h-6 hover:bg-[rgba(0,3,13,0.05)] rounded transition-colors"
      title={hasAttachments ? `${attachmentCount} attachment(s)` : "No attachments"}
      data-testid="attachment-indicator">
      {hasAttachments && attachmentCount > 0 ? (
        <Badge
          badgeContent={attachmentCount}
          color="primary"
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.625rem",
              height: "16px",
              minWidth: "16px",
              padding: "0 4px",
            },
          }}
          data-testid="Badge__e924b4">
          <PaperclipIcon className="w-4 h-4" fill="#004ACA" data-testid="paperclip-icon-with-badge" />
        </Badge>
      ) : (
        <PaperclipIcon className="w-4 h-4 opacity-30" fill="#6B7280" data-testid="paperclip-icon-no-badge" />
      )}
    </button>
  );
};
