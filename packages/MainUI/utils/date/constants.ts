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

// Base CSS class constants for date/time inputs
export const INPUT_BASE_CLASS = `w-full pl-3 pr-10 rounded-t tracking-normal h-10.5 border-0 border-b-2 
  bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) 
  text-(--color-transparent-neutral-80) font-medium text-sm leading-5
  [&::-webkit-calendar-picker-indicator]:hidden
  [&::-moz-calendar-picker-indicator]:hidden`;

export const INPUT_FOCUS_CLASS = "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]";

export const INPUT_HOVER_CLASS =
  "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)";

export const INPUT_READONLY_CLASS =
  "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)";

export const INPUT_ERROR_CLASS = "border-error-main";

export const BUTTON_BASE_CLASS =
  "absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform z-10 flex items-center justify-center";

export const BUTTON_FOCUSED_COLOR_CLASS = "text-(--color-baseline-100)";
export const BUTTON_UNFOCUSED_COLOR_CLASS = "text-(--color-transparent-neutral-60)";

export const LABEL_BASE_CLASS =
  "flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors";

export const LABEL_FOCUSED_COLOR_CLASS = "text-(--color-baseline-100)";
export const LABEL_DEFAULT_COLOR_CLASS = "text-(--color-baseline-80)";
export const LABEL_READONLY_COLOR_CLASS = "text-baseline-60";

export const HELPER_TEXT_BASE_CLASS = "text-xs mt-1";
export const HELPER_TEXT_ERROR_CLASS = "text-red-500";
export const HELPER_TEXT_DEFAULT_CLASS = "text-baseline-60";

// Utility functions to generate class names

interface InputClassNamesOptions {
  isFocused: boolean;
  isReadOnly?: boolean;
  hasError?: boolean;
}

export const getInputClassNames = ({ isFocused, isReadOnly, hasError }: InputClassNamesOptions): string => {
  const focusClass = isFocused && !isReadOnly ? INPUT_FOCUS_CLASS : "";
  const hoverClass = !isReadOnly ? INPUT_HOVER_CLASS : "";
  const readOnlyClass = isReadOnly ? INPUT_READONLY_CLASS : "";
  const errorClass = hasError ? INPUT_ERROR_CLASS : "";

  return `${INPUT_BASE_CLASS} ${focusClass} ${hoverClass} ${readOnlyClass} ${errorClass} focus:outline-none transition-colors`;
};

interface ButtonClassNamesOptions {
  isFocused: boolean;
}

export const getButtonClassNames = ({ isFocused }: ButtonClassNamesOptions): string => {
  const colorClass = isFocused ? BUTTON_FOCUSED_COLOR_CLASS : BUTTON_UNFOCUSED_COLOR_CLASS;
  return `${BUTTON_BASE_CLASS} ${colorClass}`;
};

interface LabelClassNamesOptions {
  isFocused: boolean;
  isReadOnly?: boolean;
}

export const getLabelClassNames = ({ isFocused, isReadOnly }: LabelClassNamesOptions): string => {
  let textColorClass: string;
  if (isFocused && !isReadOnly) {
    textColorClass = LABEL_FOCUSED_COLOR_CLASS;
  } else if (isReadOnly) {
    textColorClass = LABEL_READONLY_COLOR_CLASS;
  } else {
    textColorClass = LABEL_DEFAULT_COLOR_CLASS;
  }

  return `${LABEL_BASE_CLASS} ${textColorClass}`;
};

interface HelperTextClassNamesOptions {
  hasError?: boolean;
}

export const getHelperTextClassNames = ({ hasError }: HelperTextClassNamesOptions): string => {
  const colorClass = hasError ? HELPER_TEXT_ERROR_CLASS : HELPER_TEXT_DEFAULT_CLASS;
  return `${HELPER_TEXT_BASE_CLASS} ${colorClass}`;
};
