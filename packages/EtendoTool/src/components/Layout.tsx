import { Box } from "@mui/material";
import { Sidebar } from "./Sidebar";
import type { NavigationSection } from "../types/navigation";

interface LayoutProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  children: React.ReactNode;
}

export function Layout({ activeSection, onSectionChange, children }: LayoutProps) {
  return (
    <Box className="app-layout">
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
      <Box className="main-content">{children}</Box>
    </Box>
  );
}
