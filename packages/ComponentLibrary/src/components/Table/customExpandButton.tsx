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
