import { CircularProgress } from "@mui/material";

export default function Loading({
  customStyle,
  customIconProps,
}: {
  customStyle?: string;
  customIconProps?: React.ComponentProps<typeof CircularProgress>;
}) {
  return (
    <div
      className={`h-full mx-auto flex flex-col items-center justify-center ${customStyle}`}
    >
      <CircularProgress {...customIconProps} />
    </div>
  );
}

export { Loading };
