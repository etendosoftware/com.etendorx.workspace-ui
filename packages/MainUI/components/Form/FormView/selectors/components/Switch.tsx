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
/**
 * "On": track filled with the accent, white thumb on the right. "Off": empty track with a grey outline and a
 * smaller grey thumb on the left, so the two states differ by fill and not only by the thumb position. Both
 * keep 3:1 or more against the card.
 */
export const SWITCH_ON_CLASSES = "bg-(--color-dynamic-main) border-(--color-dynamic-main)";
export const SWITCH_OFF_CLASSES = "bg-transparent border-(--ui-switch-off)";
export const THUMB_ON_CLASSES = "h-4 w-4 translate-x-5 bg-(--color-baseline-0)";
export const THUMB_OFF_CLASSES = "h-3 w-3 translate-x-1 bg-(--ui-switch-off)";

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2a1757]";

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
        className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors ${FOCUS_RING_CLASSES} ${
          checked ? SWITCH_ON_CLASSES : SWITCH_OFF_CLASSES
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
        {...props}>
        <span
          className={`inline-block transform rounded-full transition-all ${checked ? THUMB_ON_CLASSES : THUMB_OFF_CLASSES}`}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";
