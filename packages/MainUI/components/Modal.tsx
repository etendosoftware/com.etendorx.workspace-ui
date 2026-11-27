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

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFocusScope } from "@workspaceui/componentlibrary/src/hooks/useFocusScope";

export default function Modal({
  children,
  open,
  onClose,
  ariaLabel,
  ariaLabelledBy,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => unknown;
  /** Accessible name of the dialog, when its content has no visible title to point to. */
  ariaLabel?: string;
  /** Id of the element that holds the title of the dialog. */
  ariaLabelledBy?: string;
}) {
  const [visible, setVisible] = useState(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  // The focus goes into the dialog when it opens, stays in it while Tab is pressed, and goes back to the
  // element that opened it when it closes (ETP-6304)
  const { onKeyDown } = useFocusScope(dialogRef, open && visible, { trap: true });

  useEffect(() => {
    if (open) {
      setVisible(true);

      return () => {
        setTimeout(() => setVisible(false), 300);
      };
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          // Capture phase + stopPropagation so this Escape closes only the modal and does not
          // also reach the form's document-level Escape handler (which would navigate to Grid).
          // ponytail: closes the outermost modal if two custom Modals ever stack; not a case today.
          e.stopPropagation();
          onClose?.();
        }
      };

      document.addEventListener("keydown", handler, true);

      return () => {
        document.removeEventListener("keydown", handler, true);
      };
    }
  }, [onClose, open]);

  return createPortal(
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      <div
        ref={dialogRef}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-hidden={open ? undefined : true}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onKeyDown={onKeyDown}
        className={`w-full h-full transition-all transform-gpu duration-200 ${open ? "opacity-100 pointer-events-auto scale-y-100 scale-x-100 ease-out" : "opacity-0 pointer-events-none scale-x-200 scale-y-150 ease-in"}`}>
        {visible ? children : null}
      </div>
    </div>,
    document.body
  );
}
