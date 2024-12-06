export type StatusType = 'success' | 'error' | 'warning';

export type IconComponent = React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

export interface StatusConfig {
  gradientColor: string;
  icon: IconComponent;
  iconBackgroundColor: string;
}

export interface StatusModalProps {
  statusText: string;
  statusType: StatusType;
  errorMessage?: string;
  saveLabel: string;
  secondaryButtonLabel: string;
}
