/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { type ReactNode, useState } from "react";
import ChevronDownIcon from "../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";

export interface CollapsibleSectionProps {
  title: string;
  /**
   * Initial expanded state. Defaults to `true` (expanded) to mirror the classic
   * UI behavior for sections whose `AD_FieldGroup.IsCollapsed` is null/false.
   * Pass `false` to start the section collapsed.
   */
  initiallyExpanded?: boolean;
  children: ReactNode;
  "data-testid"?: string;
}

/**
 * Collapsible section used by the Process Definition modal to wrap parameter
 * groups. Local state is initialized from {@link CollapsibleSectionProps.initiallyExpanded}
 * — the section is uncontrolled afterwards, so once the user toggles it the
 * choice is preserved while the modal stays mounted.
 */
export const CollapsibleSection = ({
  title,
  initiallyExpanded = true,
  children,
  "data-testid": dataTestId,
}: CollapsibleSectionProps) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  return (
    <div className="w-full" data-testid={dataTestId}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left cursor-pointer select-none">
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
          data-testid="ChevronDownIcon__761503"
        />
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </button>
      <div style={{ display: expanded ? "block" : "none" }}>{children}</div>
    </div>
  );
};

export default CollapsibleSection;
