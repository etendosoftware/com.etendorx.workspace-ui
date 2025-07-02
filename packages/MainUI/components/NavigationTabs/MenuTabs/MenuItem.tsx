"use client";

import type { WindowState } from "@/hooks/navigation/useMultiWindowURL";

export default function MenuItem({ item }: { item: WindowState }) {
  return (
    <div key={item.windowId} className="flex items-center bg-red-300">
      {item.windowId}
    </div>
  );
}
