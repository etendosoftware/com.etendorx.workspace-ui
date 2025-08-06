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

import type React from "react";
import Tooltip from "../Tooltip";
import { cleanDefaultClasses } from "../../utils/classUtil";

/**
 * Props for the IconButton component.
 * Extends all native button attributes with additional optional props.
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
  /** Text to display in a tooltip on hover */
  tooltip?: string;
  /** Position of the tooltip */
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  /** Additional CSS classes to customize styling */
  className?: string;
  /** Optional text to show alongside the icon */
  iconText?: string;
  /** Ref forwarded to the underlying button element */
  ref?: React.LegacyRef<HTMLButtonElement>;
  /** Additional CSS classes to customize the container */
  containerClassName?: string;
}

/**
 * A customizable icon button component with optional tooltip and icon text.
 *
 * It merges default styling classes with any user-provided classes using `cleanDefaultClasses`.
 * The button supports disabling and accessibility features via aria-label.
 * If `tooltip` prop is provided, the button is wrapped inside a Tooltip component.
 *
 * @param {IconButtonProps} props - Props to configure the button
 * @returns {JSX.Element} The rendered icon button element
 */
const IconButton = ({
  className = "",
  children,
  disabled = false,
  ariaLabel,
  tooltip,
  tooltipPosition,
  iconText,
  ref,
  containerClassName,
  ...rest
}: IconButtonProps) => {
  const DEFAULT_BUTTON_CLASSES = `
    transition
    duration-400
    disabled:bg-transparent
    disabled:text-(--color-transparent-neutral-30)
    rounded-full
    text-(--color-baseline-80)
    bg-(--color-baseline-0)
    hover:text-(--color-baseline-0)
    hover:bg-(--color-dynamic-main)
    inline-flex
    items-center
    justify-center
    text-[0.825rem]
    min-w-max
    [&>svg]:text-[1.5rem]
    [&>svg]:fill-current
    ${iconText ? "px-2 gap-2" : "w-8 h-8"}
  `;

  return (
    <Tooltip title={tooltip} position={tooltipPosition} containerClassName={containerClassName}>
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={cleanDefaultClasses(DEFAULT_BUTTON_CLASSES, className)}
        {...rest}>
        {children}
        {iconText && <span>{iconText}</span>}
      </button>
    </Tooltip>
  );
};

IconButton.displayName = "IconButton";
export default IconButton;
