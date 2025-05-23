import { useCallback } from 'react';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { UseItemActionsProps } from './types';

const getReportRecordId = (item: Menu) => {
  if (item.recordId) {
    return item.recordId;
  }

  if (item.window) {
    return item.window;
  }

  if (item.tableId) {
    return item.tableId;
  }

  return item.id;
};

export const useItemActions = ({ onWindowClick, onReportClick, onProcessClick }: UseItemActionsProps) => {
  const handleItemClick = useCallback(
    (item: Menu) => {
      const validType = ['Window', 'Report', 'ProcessDefinition'].includes(item.type || '');
      if (!validType) {
        console.warn(`Invalid item type: ${item.type}, defaulting to Window`);
        if (item.window && onWindowClick) {
          onWindowClick(item.window);
        }
        return;
      }

      switch (item.type) {
        case 'Window':
          if (item.window && onWindowClick) {
            onWindowClick(item.window);
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
    [onWindowClick, onReportClick, onProcessClick],
  );

  return handleItemClick;
};
