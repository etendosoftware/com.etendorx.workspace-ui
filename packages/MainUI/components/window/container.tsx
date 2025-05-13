export default function Container({ className, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) {
  return (
    <div
      {...props}
      className={`bg-white shadow rounded space-y-1 h-[50vh] max-h-full overflow-hidden min-h-0 ${className}`}
    />
  );
}
