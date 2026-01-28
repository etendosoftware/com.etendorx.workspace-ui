import { useState } from "react";
import { Box } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { ChatSidebar } from "./ChatSidebar";
import type { NavigationSection } from "../types/navigation";

interface LayoutProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  children: React.ReactNode;
}

export function Layout({ activeSection, onSectionChange, children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  return (
    <Box
      className={`app-layout ${isCollapsed ? "sidebar-collapsed" : ""} ${isChatCollapsed ? "chat-sidebar-collapsed" : ""}`}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <Box className="main-content">{children}</Box>
      <ChatSidebar isCollapsed={isChatCollapsed} onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)} />
    </Box>
  );
}
