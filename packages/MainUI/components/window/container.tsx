const BASE_STYLES = 'flex flex-col rounded-4xl p-2 gap-2 overflow-hidden min-h-0';

export default function Container({
  className,
  collapsed,
  ...props
}: React.PropsWithChildren<React.HTMLProps<HTMLDivElement> & { collapsed: boolean }>) {
  return <div {...props} className={`${BASE_STYLES} ${collapsed ? '' : 'flex-1'} ${className}`} />;
}
