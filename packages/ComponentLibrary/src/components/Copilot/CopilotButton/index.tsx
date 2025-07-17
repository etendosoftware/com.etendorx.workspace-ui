import IconButton from "../../IconButton";
import SparksIcon from "../../../assets/icons/sparks.svg";
import type { CopilotButtonProps } from "../types";

const CopilotButton: React.FC<CopilotButtonProps> = ({
  onClick,
  tooltip = "Copilot",
  disabled = false,
  className = "w-10 h-10",
}) => {
  return (
    <IconButton onClick={onClick} tooltip={tooltip} disabled={disabled} className={className} ariaLabel="Open Copilot">
      <SparksIcon />
    </IconButton>
  );
};

export default CopilotButton;
