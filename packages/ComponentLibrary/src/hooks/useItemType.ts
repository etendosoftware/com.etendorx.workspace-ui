import { useCallback } from 'react';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';

interface UseItemActionsProps {
  onWindowClick?: (windowId: string) => void;
  onReportClick?: (reportId: string, recordId: string) => void;
  onProcessClick?: (processId: string) => void;
}

export const useItemActions = ({ onWindowClick, onReportClick, onProcessClick }: UseItemActionsProps) => {
  const getReportRecordId = useCallback((item: Menu) => {
    if (item.recordId) {
      return item.recordId;
    }

    if (item.windowId) {
      return item.windowId;
    }

    if (item.tableId) {
      return item.tableId;
    }

    return item.id;
  }, []);

  const handleItemClick = useCallback(
    (item: Menu) => {
      switch (item.type) {
        case 'Window':
          if (item.windowId && onWindowClick) {
            onWindowClick(item.windowId);
          }
          break;
        case 'Report':
          if (item.id && onReportClick) {
            const recordId = getReportRecordId(item);
            onReportClick(item.id, recordId);
          }
          break;
        case 'ProcessDefinition':
          if (item.id && onProcessClick) {
            onProcessClick(item.id);
          }
          break;
        default:
          console.warn(`Unhandled item type: ${item.type}`);
      }
    },
    [onWindowClick, onReportClick, onProcessClick, getReportRecordId],
  );

  return { handleItemClick };
};
