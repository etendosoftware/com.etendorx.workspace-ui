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

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  children: ReactNode;
  minWidth?: number;
}

/**
 * DropdownPortal component
 * Renders dropdown content in a portal at the body level with automatic positioning
 * Handles scroll and resize events to keep dropdown positioned correctly
 */
export const DropdownPortal = ({ isOpen, triggerRef, children, minWidth = 256 }: DropdownPortalProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    // Initial position calculation
    updatePosition();

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  const portalContent = (
    <div
      className="absolute z-[9999] mt-1 bg-white rounded shadow-lg overflow-hidden border border-transparent-neutral-10"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: position.width > minWidth ? `${position.width}px` : `${minWidth}px`,
      }}>
      {children}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(portalContent, document.body) : null;
};
