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

import { useMetadataContext } from "@/contexts/metadata";
import { useTranslation } from "@/hooks/useTranslation";
import { HelpButton } from "@workspaceui/componentlibrary/src/components";
import { shouldShowHelp } from "@/utils/help/buildHelpContent";
import { useHelpPanelStore } from "@/stores/helpPanelStore";

/**
 * Trigger for contextual Help on the active window: decides whether the Help
 * button should be mounted at all (`shouldShowHelp`) and toggles the shared
 * `useHelpPanelStore`. The panel itself (`HelpDrawer`) renders elsewhere in
 * the tree (`layout.tsx`) since it needs to sit as a layout sibling of the
 * content column, not nested inside `Navigation`.
 */
const HelpAccess: React.FC = () => {
  const { t } = useTranslation();
  const { window } = useMetadataContext();
  const toggle = useHelpPanelStore((state) => state.toggle);

  if (!shouldShowHelp(window)) {
    return null;
  }

  return <HelpButton onClick={toggle} tooltip={t("common.help")} data-testid="HelpButton__ad3365" />;
};

export default HelpAccess;
