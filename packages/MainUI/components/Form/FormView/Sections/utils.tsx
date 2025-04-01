import { useTheme } from '@mui/material';
import Info from '@workspaceui/componentlibrary/src/assets/icons/info.svg';
import InfoIcon from '@workspaceui/componentlibrary/src/assets/icons/file-text.svg';
import FileIcon from '@workspaceui/componentlibrary/src/assets/icons/file.svg';
import FolderIcon from '@workspaceui/componentlibrary/src/assets/icons/folder.svg';

export const DefaultIcon = () => {
  const theme = useTheme();

  return (
    <Info fill={theme.palette.baselineColor.neutral[80]} />
  );
}

const iconMap: Record<string, React.ReactElement> = {
  'Main Section': <FileIcon />,
  'More Information': <InfoIcon />,
  Dimensions: <FolderIcon />,
};

export const getIconForGroup = (identifier: string) => {
  return iconMap[identifier] || DefaultIcon;
};
