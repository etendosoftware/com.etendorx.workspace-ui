import { CircularProgress } from "@mui/material";

export default function Loading({
  className,
  customIconProps,
}: {
  className?: string;
  customIconProps?: React.ComponentProps<typeof CircularProgress>;
}) {
  return (
    <div
      className={`h-full mx-auto flex flex-col items-center justify-center ${className}`}
    >
      <CircularProgress {...customIconProps} />
    </div>
  );
}

export { Loading };
