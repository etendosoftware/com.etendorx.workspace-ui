"use client";

import Loading from "@/components/loading";
import { useLoading } from "@/contexts/loading";

export default function GlobalLoading() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <Loading
      className="h-screen w-screen absolute z-100 bg-black/25"
      customIconProps={{
        size: 60,
        thickness: 4,
        sx: {
          color: "#1976d2",
        },
      }}
    />
  );
}
