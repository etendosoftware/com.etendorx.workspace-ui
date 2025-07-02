import type React from "react";
import { Dialog, DialogContent, DialogTitle, IconButton as MuiIconButton } from "@mui/material";
import type { IAssistant, ILabels } from "@workspaceui/api-client/src/api/copilot";
import { Close as CloseIcon, Minimize, Maximize } from "@mui/icons-material";
import ChatInterface from "./ChatInterface";

export interface CopilotPopupProps {
  open: boolean;
  onClose: () => void;
  assistants: IAssistant[];
  labels: ILabels;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const CopilotPopup: React.FC<CopilotPopupProps> = ({
  open,
  onClose,
  assistants,
  labels,
  isExpanded = false,
  onToggleExpanded,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isExpanded ? "lg" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          height: isExpanded ? "80vh" : "600px",
          maxHeight: "90vh",
          borderRadius: 2,
        },
      }}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}>
        <span>Perfil Copilot</span>
        <div>
          {onToggleExpanded && (
            <MuiIconButton onClick={onToggleExpanded} size="small">
              {isExpanded ? <Minimize /> : <Maximize />}
            </MuiIconButton>
          )}
          <MuiIconButton onClick={onClose} size="small">
            <CloseIcon />
          </MuiIconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", height: "100%" }}>
        <ChatInterface assistants={assistants} labels={labels} isExpanded={isExpanded} />
      </DialogContent>
    </Dialog>
  );
};

export default CopilotPopup;
