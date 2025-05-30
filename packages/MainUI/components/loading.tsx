import { CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <div className="h-full mx-auto flex flex-col items-center justify-center">
      <CircularProgress />
    </div>
  );
}

export { Loading };
