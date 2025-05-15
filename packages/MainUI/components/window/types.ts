import type { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export type TabsProps = { tabs: Tab[] };
export type TabsSwitchProps = { current: Tab; tabs: Tab[]; onClick: (tab: Tab) => void; onClose: () => void };
export type TabSwitchProps = { tab: Tab; active: boolean; onClick: (tab: Tab) => void };
export type TabLevelProps = { tab: Tab; collapsed?: boolean };
