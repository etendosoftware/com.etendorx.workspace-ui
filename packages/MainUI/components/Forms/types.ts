export interface LoginProps {
  title: string;
  onSubmit: (username: string, password: string) => Promise<void>;
  error?: string;
}

export interface GridItemProps {
  bgColor?: string;
  children?: React.ReactNode;
}
