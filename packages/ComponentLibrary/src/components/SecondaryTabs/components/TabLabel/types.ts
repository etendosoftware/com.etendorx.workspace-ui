import type { ReactNode } from "react";

export interface TabLabelProps {
    icon: ReactNode;
    text: string;
    count?: number | boolean;
    isLoading?: boolean;
}
