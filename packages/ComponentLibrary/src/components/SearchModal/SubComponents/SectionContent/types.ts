import type { Section } from "../../../SecondaryTabs/types";

export interface SectionContentProps {
  section: Section;
  isLast: boolean;
  variant: "default" | "tabs";
}
