export default function Select({
  children,
  ...props
}: React.PropsWithChildren<React.SelectHTMLAttributes<HTMLSelectElement>>) {
  return <select {...props}>{children}</select>;
}
