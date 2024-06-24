import { ReactNode } from "react";

export interface TabPanelProps {
    children?: ReactNode;
    value: number;
    index: number;
}
