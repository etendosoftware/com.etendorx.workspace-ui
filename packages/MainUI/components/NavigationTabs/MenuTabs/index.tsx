"use client";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import MenuItem from "@/components/NavigationTabs/MenuTabs/MenuItem";
import { useMetadataContext } from "@/hooks/useMetadataContext";

interface MenuTabsProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (windowId: string) => void;
}

export default function MenuTabs({ anchorEl, onClose, onSelect }: MenuTabsProps) {
  const { windows } = useMultiWindowURL();
  const { getWindowTitle } = useMetadataContext();

  return (
    <Menu anchorEl={anchorEl} onClose={onClose}>
      <div
        className="w-full h-full max-h-screen bg-[var(--color-baseline-0)] border border-[var(--color-transparent-neutral-10)] rounded-xl flex flex-col gap-2 p-2 overflow-y-auto"
        style={{
          boxShadow: "0px 4px 10px var(--color-transparent-neutral-10)",
        }}>
        {windows.map((window) => {
          const windowId = window.windowId;
          const title = window.title || getWindowTitle?.(window.windowId);
          const isActive = window.isActive;
          return <MenuItem key={windowId} windowId={windowId} title={title} isActive={isActive} onSelect={onSelect} />;
        })}
      </div>
    </Menu>
  );
}
