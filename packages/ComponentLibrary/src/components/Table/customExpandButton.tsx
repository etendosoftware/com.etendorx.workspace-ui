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

import type React from "react";
import type { MRT_Row } from "material-react-table";
import IconButton from "../IconButton";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg";
import ChevronUpIcon from "../../assets/icons/chevron-up.svg";
import ChevronRightIcon from "../../assets/icons/chevron-right.svg";
import type { Organization } from "@workspaceui/storybook/src/stories/Components/Table/types";

interface CustomExpandButtonProps {
  row: MRT_Row<Organization>;
}

const CustomExpandButton: React.FC<CustomExpandButtonProps> = ({ row }) => {
  const isExpanded = row.getIsExpanded();
  const canExpand = row.getCanExpand();

  if (!canExpand) {
    return (
      <IconButton disabled className="w-4 h-4">
        <ChevronRightIcon />
      </IconButton>
    );
  }

  return (
    <IconButton
      onClick={row.getToggleExpandedHandler()}
      tooltip={isExpanded ? "Collapse" : "Expand"}
      className="w-4 h-4">
      {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </IconButton>
  );
};

export default CustomExpandButton;
