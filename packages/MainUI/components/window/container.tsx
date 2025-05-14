const BASE_STYLES = 'flex flex-1 flex-col rounded-4xl p-2 gap-2 overflow-hidden min-h-0';

export default function Container({ className, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) {
  return <div {...props} className={`${BASE_STYLES} ${className}`} />;
}
