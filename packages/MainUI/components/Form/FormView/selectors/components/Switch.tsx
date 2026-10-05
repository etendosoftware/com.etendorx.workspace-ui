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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { forwardRef, useCallback } from "react";
import { FORM_KEYS } from "@/utils/form/keyboard";

/** Key that flips a boolean field, the one Classic's CycleItem listens to. */
const TOGGLE_KEY = FORM_KEYS.SPACE;

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  field: Field;
}

/**
 * Focus ring of the switch. It is stated explicitly — with a colour — because
 * `focus:outline-none` removes the browser's own indicator, and a ring with no
 * colour falls back to `currentColor`, which is invisible against the track. A
 * keyboard user could reach the field without any sign of being on it.
 */
const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#004ACA]";

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className = "", field, ...props }, ref) => {
    const handleToggle = useCallback(() => {
      if (disabled) return;
      onCheckedChange(!checked);
    }, [checked, disabled, onCheckedChange]);

    /**
     * Space toggles the value, exactly as `isc.CycleItem.handleKeyPress` does in
     * Etendo Classic. Cancelling the default keeps the page from scrolling and
     * suppresses the button's own activation, so the value flips only once.
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key !== TOGGLE_KEY) return;
        e.preventDefault();
        handleToggle();
      },
      [handleToggle]
    );

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={field.name}
        aria-readonly={disabled}
        aria-required={field.isMandatory}
        aria-disabled={disabled}
        aria-details={field.helpComment}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        ref={ref}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${FOCUS_RING_CLASSES} ${
          checked ? "bg-blue-600" : "bg-gray-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
        {...props}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
