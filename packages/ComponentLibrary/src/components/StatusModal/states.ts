import { theme } from '../../theme';
import CheckIcon from '../../assets/icons/check.svg';
import ErrorIcon from '../../assets/icons/alert-octagon.svg';
import WarningIcon from '../../assets/icons/alert-triangle.svg';

export type StatusType = 'success' | 'error' | 'warning';

export type IconComponent = React.FunctionComponent<
  React.SVGProps<SVGSVGElement> & { title?: string }
>;

export interface StatusConfig {
  gradientColor: string;
  iconBackgroundColor: string;
  icon: IconComponent;
}

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
};
