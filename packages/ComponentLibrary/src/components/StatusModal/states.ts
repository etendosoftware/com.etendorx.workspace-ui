import CheckIcon from '../../assets/icons/check.svg';
import ErrorIcon from '../../assets/icons/x-octagon.svg';
import WarningIcon from '../../assets/icons/alert-triangle.svg';
import type { StatusConfig, StatusType } from './types';
import { theme } from '../../theme';

export const statusConfig: Record<StatusType, StatusConfig> = {
  success: {
    gradientColor: '#BFFFBF',
    iconBackgroundColor: theme.palette.success.main,
    icon: CheckIcon,
  },
  error: {
    gradientColor: '#FFCCD6',
    iconBackgroundColor: theme.palette.error.main,
    icon: ErrorIcon,
  },
  warning: {
    gradientColor: theme.palette.warning.light,
    iconBackgroundColor: theme.palette.warning.main,
    icon: WarningIcon,
  },
  info: {
    gradientColor: theme.palette.warning.light,
    iconBackgroundColor: theme.palette.warning.main,
    icon: WarningIcon,
  },
};
