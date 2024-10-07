import {
  type Etendo,
  Metadata,
} from '@workspaceui/etendohookbinder/api/metadata';

export const groupTabsByLevel = (windowData?: Etendo.WindowMetadata) => {
  if (!windowData) {
    return [];
  }

  const tabs: Etendo.Tab[][] = Array(windowData.tabs.length);

  windowData?.tabs.forEach(tab => {
    if (tabs[tab.level]) {
      tabs[tab.level].push(tab);
    } else {
      tabs[tab.level] = [tab];
    }
  });

  return tabs;
};

export const buildColumnsData = (windowData?: Etendo.WindowMetadata) => {
  const cols: Record<number, Record<string, Etendo.Column[]>> = {};

  if (windowData?.tabs?.length) {
    windowData.tabs.forEach(tab => {
      if (!cols[tab.level]) {
        cols[tab.level] = {};
      }

      cols[tab.level][tab.id] = Metadata.getColumns(tab.id);
    });
  }

  return cols;
};
