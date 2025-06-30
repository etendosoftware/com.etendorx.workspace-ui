import type { Tab } from "@workspaceui/api-client/src/api/types";

export type TabsProps = { tabs: Tab[] };
export type TabsSwitchProps = {
  current: Tab;
  tabs: Tab[];
  collapsed?: boolean;
  onClick: (tab: Tab) => void;
  onDoubleClick: (tab: Tab) => void;
  onClose: () => void;
};
export type TabSwitchProps = {
  tab: Tab;
  active: boolean;
  onClick: (tab: Tab) => void;
  onDoubleClick: (tab: Tab) => void;
  isWindow?: boolean;
  showIcon?: boolean;
  onClose?: (e: React.MouseEvent) => void;
  canClose?: boolean;
};

export type TabLevelProps = { tab: Tab; collapsed?: boolean };
