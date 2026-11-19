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

import { useSyncExternalStore } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import MessageBanner from "@/components/MessageBanner";
import { getMessageBarState, messageBar, subscribeMessageBar } from "@/utils/processes/definition/messageBarStore";

/**
 * Renders the in-modal message bar requested by a migrated script through
 * `view.messageBar` / `messageBar`. Subscribes to the singleton store and shows
 * one sticky banner at a time, reusing the modal's existing banner visual
 * language (left-border accent on a neutral background). Mounted inside the
 * process modal. The message lifetime is owned by the modal (cleared on open),
 * not by this host: the host can unmount/remount during the modal's loading
 * transitions, so clearing here would wipe a message a script just set.
 */
export default function ProcessMessageBar() {
  const { t } = useTranslation();
  const state = useSyncExternalStore(subscribeMessageBar, getMessageBarState, getMessageBarState);

  if (!state) return null;

  // Body is sanitized in the store via DOMPurify (formatting tags only).
  return (
    <MessageBanner
      severity={state.severity}
      title={state.title}
      html={state.html}
      actions={state.actions}
      onClose={() => messageBar.hide()}
      closeLabel={t("common.close")}
      testIdPrefix="ProcessMessageBar"
      data-testid="MessageBanner__ab7595"
    />
  );
}
