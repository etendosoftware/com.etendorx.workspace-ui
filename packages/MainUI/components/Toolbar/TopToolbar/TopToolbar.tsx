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

import type { TopToolbarProps } from "../types";
import ToolbarSection from "../ToolbarSection";

export const TopToolbar = ({ leftSection, centerSection, rightSection, processButton }: TopToolbarProps) => {
  const isCenterSectionsDisabled = centerSection.buttons.every((button) => button.disabled) && processButton.disabled;
  return (
    <div className="h-10 flex justify-between items-center gap-1">
      <ToolbarSection {...leftSection} className="bg-[var(--color-baseline-0)] rounded-4xl p-1" />
      <ToolbarSection
        {...centerSection}
        processButton={processButton}
        className={`bg-[var(--color-baseline-0)] rounded-4xl p-1 w-full flex ${isCenterSectionsDisabled ? "opacity-40" : ""}`}
        style={{
          boxShadow: "0px 4px 10px var(--color-transparent-neutral-10)",
        }}
      />
      <ToolbarSection {...rightSection} className="bg-transparent-neutral-5 rounded-4xl p-1" />
    </div>
  );
};

export default TopToolbar;
