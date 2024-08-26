export interface TabProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: {
    identifier?: string | null;
    type?: string | null;
  };
  noIdentifierLabel?: string;
  noTypeLabel?: string;
  handleFullSize: () => void;
  isFullSize: boolean;
}

export interface TabContentProps {
  identifier: string | null;
  type: string | null;
  onClose: () => void;
  handleFullSize: () => void;
  isFullSize: boolean;
}

export interface ResizableTabContainerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: {
    identifier: string;
    type: string;
  };
  onHeightChange?: (height: number) => void;
}
