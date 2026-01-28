import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import InstallDesktopIcon from "@mui/icons-material/InstallDesktop";
import CodeIcon from "@mui/icons-material/Code";
import SettingsIcon from "@mui/icons-material/Settings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { NavigationSection } from "../types/navigation";

interface SidebarProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const NAV_ITEMS: Array<{
  id: NavigationSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "configuration",
    label: "Configuración",
    description: "gradle.properties",
    icon: <SettingsIcon />,
  },
  {
    id: "installation",
    label: "Instalación",
    description: "Setup inicial",
    icon: <InstallDesktopIcon />,
  },
  {
    id: "docker",
    label: "Docker",
    description: "Wrapper y contenedores",
    icon: <HealthAndSafetyIcon />,
  },
  {
    id: "development",
    label: "Desarrollo",
    description: "Panel de control",
    icon: <CodeIcon />,
  },
];

export function Sidebar({ activeSection, onSectionChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  return (
    <Box className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <Box className="sidebar-header">
        {!isCollapsed && (
          <>
            <Typography variant="h6" fontWeight={700}>
              ETENDO TOOL
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Centro de Control
            </Typography>
          </>
        )}
        {isCollapsed && (
          <Typography variant="h6" fontWeight={700} sx={{ textAlign: "center" }}>
            ET
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: isCollapsed ? 1 : 2 }} />

      <List component="nav" sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.id} title={isCollapsed ? item.label : ""} placement="right">
            <ListItemButton
              selected={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: isCollapsed ? "center" : "flex-start",
                px: isCollapsed ? 1 : 2,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "inherit",
                  },
                },
              }}>
              <ListItemIcon
                sx={{
                  minWidth: isCollapsed ? 0 : 40,
                  color: activeSection === item.id ? "inherit" : "text.secondary",
                  justifyContent: "center",
                }}>
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <ListItemText
                  primary={item.label}
                  secondary={activeSection !== item.id ? item.description : undefined}
                  primaryTypographyProps={{
                    fontWeight: activeSection === item.id ? 600 : 400,
                    fontSize: "0.95rem",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Botón de toggle */}
      <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
        <IconButton onClick={onToggleCollapse} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Box className="sidebar-footer">
        {!isCollapsed && (
          <Typography variant="caption" color="text.secondary">
            Etendo Development Kit
          </Typography>
        )}
      </Box>
    </Box>
  );
}
