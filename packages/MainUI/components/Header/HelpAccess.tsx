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

import { useEffect, useRef, useState } from "react";
import { useMetadataContext } from "@/contexts/metadata";
import { useTranslation } from "@/hooks/useTranslation";
import { HelpButton } from "@workspaceui/componentlibrary/src/components";
import { shouldShowHelp } from "@/utils/help/buildHelpContent";
import HelpDrawer from "../HelpDrawer/HelpDrawer";

/**
 * Orchestrates access to contextual Help for the active window: decides
 * whether the Help trigger should be mounted at all (`shouldShowHelp`),
 * owns the drawer's open/close state, and closes the drawer whenever the
 * active window changes while it's open — a stale window's help content
 * should never linger onscreen after the user navigates away from it.
 */
const HelpAccess: React.FC = () => {
  const { t } = useTranslation();
  const { window, windowId } = useMetadataContext();
  const [open, setOpen] = useState(false);
  const previousWindowId = useRef(windowId);

  useEffect(() => {
    if (open && previousWindowId.current !== windowId) {
      setOpen(false);
    }
    previousWindowId.current = windowId;
  }, [windowId, open]);

  if (!shouldShowHelp(window)) {
    return null;
  }

  return (
    <>
      <HelpButton onClick={() => setOpen(true)} tooltip={t("common.help")} />
      <HelpDrawer open={open} window={window} onClose={() => setOpen(false)} />
    </>
  );
};

export default HelpAccess;
