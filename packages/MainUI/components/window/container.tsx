const BASE_STYLES = 'shadow bg-white border border-baseline-40 border-b-0 h-[50%] max-h-full overflow-hidden min-h-0';

export default function Container({ className, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) {
  return <div {...props} className={`${BASE_STYLES} ${className}`} />;
}
