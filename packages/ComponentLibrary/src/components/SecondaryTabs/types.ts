import { ReactNode } from 'react';

export interface TabConfig {
    icon: ReactNode;
    label: string;
    numberOfItems?: number;
    isLoading?: boolean;
    content: ReactNode;
    onClick: () => void;
}

export interface SecondaryTabsProps {
    tabsContent: TabConfig[];
}
