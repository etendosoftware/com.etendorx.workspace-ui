export default function Container({ className, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) {
  return (
    <div
      {...props}
      className={`bg-baseline-20 rounded-xl space-y-1 h-[50vh] max-h-full overflow-hidden p-2 min-h-0 border-4 border-blue-400 ${className}`}
    />
  );
}
