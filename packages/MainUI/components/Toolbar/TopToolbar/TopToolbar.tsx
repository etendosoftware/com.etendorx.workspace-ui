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
import { useToolbarExtrasSlot } from "@/contexts/ToolbarExtrasSlot";

export const TopToolbar = ({ leftSection, centerSection, rightSection, processButton }: TopToolbarProps) => {
  const { setSlot: setExtrasSlot } = useToolbarExtrasSlot();
  const isCenterSectionsDisabled = centerSection.buttons.every((button) => button.disabled) && processButton?.disabled;
  // The center group scrolls when the row is too narrow (the right group also holds the record navigation, so a
  // 1280px screen with the menu open does not fit it all): without that its buttons spilled under the right group.
  return (
    <div className="h-11 p-1 flex justify-between items-center gap-0.5">
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        <ToolbarSection
          {...leftSection}
          className="flex items-center gap-1 rounded-full bg-(--ui-group-bg) p-0.5 [&_.toolbar-button-refresh]:bg-(--ui-table-head-bg) [&_.toolbar-button-refresh]:border-0 [&_.toolbar-button-refresh]:h-8 [&_.toolbar-button-refresh]:w-8"
          data-testid="ToolbarSection__f0537e_1"
        />
        <ToolbarSection
          {...centerSection}
          processButton={processButton}
          className={`bg-(--ui-group-bg) rounded-full p-0.5 flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto hide-scrollbar [&_button]:bg-transparent [&_button]:border-0 [&_button]:h-8 [&_button]:w-8 ${isCenterSectionsDisabled ? "opacity-40 dark:opacity-90" : ""}`}
          data-testid="ToolbarSection__f0537e_2"
        />
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-(--ui-group-bg) p-0.5 [&_button]:h-8 [&_button]:w-8 [&_button]:rounded-full [&_button]:border-0 [&_button:not([style*=background-color])]:bg-transparent! [&_button:not([style*=background-color]):not(:disabled):hover]:bg-(--color-dynamic-main)!">
        <ToolbarSection {...rightSection} className="flex items-center gap-1" data-testid="ToolbarSection__f0537e_3" />
        <div
          ref={setExtrasSlot}
          className="flex items-center gap-1 [&_button]:p-0 [&_svg]:text-[1.125rem]! [&_button:last-child_svg]:text-[1.375rem]!"
          data-testid="ToolbarExtrasSlot__container"
        />
      </div>
    </div>
  );
};

export default TopToolbar;
