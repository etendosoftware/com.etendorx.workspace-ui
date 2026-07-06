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

import { useEffect, useSyncExternalStore } from "react";
import ActionModal from "@workspaceui/componentlibrary/src/components/ActionModal";
import type { ActionButton } from "@workspaceui/componentlibrary/src/components/ActionModal/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  clearDialogs,
  type DialogKind,
  type DialogRequest,
  peekDialog,
  resolveDialog,
  subscribeDialogs,
} from "@/utils/processes/definition/dialogs";

/**
 * Renders the active process dialog (`confirm` / `warn` / `say`) requested by a
 * migrated script. Subscribes to the singleton dialog queue and shows one dialog
 * at a time through the shared {@link ActionModal}. Mounted inside the process
 * modal, so its lifecycle is bound to the modal: on unmount every pending dialog
 * resolves to `false` (the safe default) instead of hanging.
 */
export default function ProcessDialogHost() {
  const { t } = useTranslation();
  const current = useSyncExternalStore(subscribeDialogs, peekDialog, peekDialog);

  // Resolve any dialog still pending when the host unmounts (modal closed).
  useEffect(() => () => clearDialogs(false), []);

  if (!current) return null;

  const defaultTitle = (kind: DialogKind): string => {
    switch (kind) {
      case "warn":
        return t("process.warning");
      case "say":
        return t("process.messageTitle");
      default:
        return t("common.confirm");
    }
  };

  const resolve = (request: DialogRequest, result: boolean) => resolveDialog(request.id, result);

  const buttons: ActionButton[] =
    current.kind === "confirm"
      ? [
          { id: "cancel", label: t("common.cancel"), variant: "secondary", onClick: () => resolve(current, false) },
          { id: "confirm", label: t("common.confirm"), variant: "primary", onClick: () => resolve(current, true) },
        ]
      : [{ id: "ok", label: t("common.confirm"), variant: "primary", onClick: () => resolve(current, true) }];

  return (
    <ActionModal
      isOpen
      title={current.title ?? defaultTitle(current.kind)}
      message={current.message}
      buttons={buttons}
      onClose={() => resolve(current, false)}
      t={t}
      data-testid="ActionModal__e16b02"
    />
  );
}
