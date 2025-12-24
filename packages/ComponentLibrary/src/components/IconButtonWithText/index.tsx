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
import { cleanDefaultClasses } from "../../utils/classUtil";
import type { ButtonType } from "./types";
import { FILLED_BUTTON_TYPE, OUTLINED_BUTTON_TYPE } from "./constants";

const FILLED_DEFAULT_STYLES = `
  bg-[var(--color-baseline-100)]
  hover:bg-[var(--color-dynamic-main)]
  disabled:bg-[var(--color-transparent-neutral-20)]
  text-[var(--color-baseline-0)]
  font-medium
`;

const OUTLINED_DEFAULT_STYLES = `
  border: 1px solid var(--color-transparent-neutral-20);
  bg-[var(--color-transparent-neutral-0)]
  hover:bg-[var(--color-etendo-dark)]
  hover:border-none
  hover:text-[var(--color-baseline-0)]
  disabled:bg-[var(--color-transparent-neutral-10)]
  disabled:opacity-30
  text-[var(--color-baseline-70)]
`;

const getCurrentStyles = (buttonType: ButtonType) => {
  switch (buttonType) {
    case FILLED_BUTTON_TYPE:
      return FILLED_DEFAULT_STYLES;
    case OUTLINED_BUTTON_TYPE:
      return OUTLINED_DEFAULT_STYLES;
    default:
      return "";
  }
};

/**
 * Props for the Button component.
 * Extends all native button attributes with additional optional props.
 */
export interface IconButtonWithTextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Type of the button */
  buttonType: ButtonType;
  /** Text to show inside the button */
  text: string;
  /** Icon to show inside at the left of the button */
  leftIcon: React.ReactNode;
  /** Icon to show inside at the right of the button */
  rightIcon?: React.ReactNode;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
  /** Custom styles for the container */
  customContainerStyles?: string;
  /** Custom styles for the text */
  customTextStyles?: string;
  /** Ref forwarded to the underlying button element */
  ref?: React.LegacyRef<HTMLButtonElement>;
}

/**
 * A customizable button component with a required icon and text.
 *
 * It merges default styling classes with any user-provided classes using `cleanDefaultClasses`.
 * The button supports disabling and accessibility features via aria-label.
 *
 * @param {IconButtonWithTextProps} props - Props to configure the button
 * @returns {JSX.Element} The rendered button element
 */
const IconButtonWithText = ({
  buttonType = FILLED_BUTTON_TYPE,
  text,
  leftIcon,
  rightIcon,
  disabled = false,
  ariaLabel,
  customContainerStyles,
  customTextStyles,
  ref,
  ...rest
}: IconButtonWithTextProps): React.ReactElement => {
  const DEFAULT_STYLES = `
    transition
    duration-400
    rounded-full
    inline-flex
    items-center
    justify-center
    text-[0.825rem]
    font-medium
    min-w-max
    gap-1
    [&>svg]:text-[1.5rem]
    [&>svg]:fill-current
  `;

  const currentDefaultStyles = cleanDefaultClasses(DEFAULT_STYLES, getCurrentStyles(buttonType));

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={cleanDefaultClasses(currentDefaultStyles, customContainerStyles)}
      {...rest}>
      {leftIcon}
      <span className={customTextStyles}>{text}</span>
      {rightIcon}
    </button>
  );
};

IconButtonWithText.displayName = "IconButtonWithText";
export default IconButtonWithText;
