const BASE_STYLES = 'flex flex-1 flex-col bg-baseline-20 p-2 overflow-hidden min-h-0';

export default function Container({ className, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) {
  return <div {...props} className={`${BASE_STYLES} ${className}`} />;
}
