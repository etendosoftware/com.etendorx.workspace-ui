/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

// @data-testid-ignore
"use client";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";
import MenuItem from "@/components/NavigationTabs/MenuTabs/MenuItem";

interface MenuTabsProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (windowId: string) => void;
}

export default function MenuTabs({ anchorEl, onClose, onSelect }: MenuTabsProps) {
  const { windows } = useMultiWindowURL();

  return (
    <Menu anchorEl={anchorEl} onClose={onClose} data-testid={`Menu__${windows[0]?.windowId ?? "8b7d80"}`}>
      <div
        className="w-full h-full max-h-screen bg-[var(--color-baseline-0)] border border-[var(--color-transparent-neutral-10)] rounded-xl flex flex-col gap-2 p-2 overflow-y-auto"
        style={{
          boxShadow: "0px 4px 10px var(--color-transparent-neutral-10)",
        }}>
        {windows.map((window) => {
          const windowId = window.windowId;
          const title = window.title || "Loading...";
          const isActive = window.isActive;
          return (
            <MenuItem
              key={windowId}
              windowId={windowId}
              title={title}
              isActive={isActive}
              onSelect={onSelect}
              data-testid={`MenuItem__${windowId ?? "8b7d80"}`}
            />
          );
        })}
      </div>
    </Menu>
  );
}
