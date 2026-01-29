import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from "@mui/material";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import InstallDesktopIcon from "@mui/icons-material/InstallDesktop";
import CodeIcon from "@mui/icons-material/Code";
import type { NavigationSection } from "../types/navigation";

interface SidebarProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
}

const NAV_ITEMS: Array<{
  id: NavigationSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "system-status",
    label: "Estado del Sistema",
    description: "Prerrequisitos",
    icon: <HealthAndSafetyIcon />,
  },
  {
    id: "installation",
    label: "Instalación",
    description: "Setup inicial",
    icon: <InstallDesktopIcon />,
  },
  {
    id: "development",
    label: "Desarrollo",
    description: "Panel de control",
    icon: <CodeIcon />,
  },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <Box className="sidebar">
      <Box className="sidebar-header">
        <Typography variant="h6" fontWeight={700}>
          ETENDO TOOL
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Centro de Control
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <List component="nav" sx={{ px: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.id}
            selected={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
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
                minWidth: 40,
                color: activeSection === item.id ? "inherit" : "text.secondary",
              }}>
              {item.icon}
            </ListItemIcon>
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
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box className="sidebar-footer">
        <Typography variant="caption" color="text.secondary">
          Etendo Development Kit
        </Typography>
      </Box>
    </Box>
  );
}
