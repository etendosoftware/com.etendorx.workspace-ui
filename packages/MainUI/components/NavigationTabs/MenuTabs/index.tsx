"use client";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import MenuItem from "@/components/NavigationTabs/MenuTabs/MenuItem";

export default function MenuTabs({
  anchorEl,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}) {
  const { windows } = useMultiWindowURL();

  return (
    <Menu anchorEl={anchorEl} onClose={onClose}>
      <div className="w-full h-full bg-white rounded-xl flex flex-col gap-2 p-2">
        {windows.map((window) => {
          return <MenuItem key={window.windowId} item={window} />;
        })}
      </div>
    </Menu>
  );
}
