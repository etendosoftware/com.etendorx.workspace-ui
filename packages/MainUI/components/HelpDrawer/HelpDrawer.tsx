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

"use client";

import type React from "react";
import Modal from "../Modal";
import { sanitizeMessageHtml } from "@/utils/processes/definition/sanitizeHtml";
import { buildHelpSections } from "@/utils/help/buildHelpContent";
import { useTranslation } from "@/hooks/useTranslation";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import type { WindowMetadata } from "@workspaceui/api-client/src/api/types";

export interface HelpDrawerProps {
  open: boolean;
  window: WindowMetadata | null | undefined;
  onClose: () => void;
}

/**
 * Right-anchored panel showing contextual Help for the active window:
 * window-level help text, followed by each tab's help text and the list of
 * fields (within that tab) that carry help content.
 *
 * Reuses `Modal` purely for its portal + Escape-close plumbing; the
 * right-anchored panel look and click-outside-to-close behavior are this
 * component's own (Modal's own usage elsewhere is a centered dialog).
 *
 * All rich text is sanitized with `sanitizeMessageHtml` — the locked-down
 * allowlist (no `<a>`, no images) used for admin-authored documentation
 * prose, not `RichTextSelector`'s permissive default DOMPurify call.
 */
const HelpDrawer: React.FC<HelpDrawerProps> = ({ open, window, onClose }) => {
  const { t } = useTranslation();
  const sections = window ? buildHelpSections(window) : [];
  const windowHelp = window?.helpComment?.trim() ?? "";

  return (
    <Modal open={open} onClose={onClose}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal already owns Escape-handling via a capture-phase document listener (Modal.tsx), so this overlay's click-only close doesn't need a redundant keyboard handler here. */}
      <div
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
        role="presentation"
        data-testid="help-drawer-overlay">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops the overlay's onClose click from firing; not itself an actionable control */}
        <div
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
          data-testid="help-drawer-panel">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">
              {t("common.helpFor")} {window?.name}
            </h2>
            <button type="button" onClick={onClose} aria-label={t("common.close")}>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-6">
            {windowHelp && (
              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizeMessageHtml above
              <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(windowHelp) }} />
            )}
            {sections.map((tab) => (
              <section key={tab.id}>
                <h3 className="font-semibold">{tab.name}</h3>
                {tab.helpComment && (
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizeMessageHtml above
                  <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(tab.helpComment) }} />
                )}
                {tab.fields.length > 0 && (
                  <ul className="mt-2 space-y-2">
                    {tab.fields.map((field) => (
                      <li key={field.id}>
                        <strong>{field.name}</strong>
                        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizeMessageHtml above */}
                        <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(field.helpComment) }} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HelpDrawer;
