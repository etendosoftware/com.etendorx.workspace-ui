import { ReactNode } from 'react';

export interface TabConfig {
    icon: ReactNode;
    label: string;
    numberOfItems?: number;
    content: ReactNode;
    onClick: () => void;
}

export interface SecondaryTabsProps {
    tabsConfig: TabConfig[];
}
