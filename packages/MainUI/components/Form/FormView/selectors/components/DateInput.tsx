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
import { forwardRef, useCallback, useRef, useState, useEffect } from "react";
import CalendarIcon from "../../../../../../ComponentLibrary/src/assets/icons/calendar.svg";

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isReadOnly?: boolean;
  error?: boolean;
  helperText?: string;
  field: Field;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ name, label, isReadOnly, error, helperText, field, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleCalendarClick = useCallback(() => {
      if (!isReadOnly && inputRef.current) {
        inputRef.current.showPicker();
        // Asegurar que el focus se mantenga en el input después de abrir el picker
        inputRef.current.focus();
      }
    }, [isReadOnly]);

    const handleRef = useCallback(
      (node: HTMLInputElement) => {
        if (node) {
          inputRef.current = node;
        }

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Verificar si el foco se está moviendo fuera del contenedor completo
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!containerRef.current?.contains(relatedTarget)) {
          setIsFocused(false);
        }
        props.onBlur?.(e);
      },
      [props]
    );

    // Efecto para detectar clics fuera del componente y quitar el focus
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsFocused(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const getLabelClass = useCallback(() => {
      return `flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors ${
        isFocused && !isReadOnly
          ? "text-(--color-baseline-100)"
          : isReadOnly
            ? "text-baseline-60"
            : "text-(--color-baseline-80)"
      }`;
    }, [isFocused, isReadOnly]);

    const getInputClass = useCallback(() => {
      const baseClass = `w-full pl-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 
          bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) 
          text-(--color-transparent-neutral-80) font-medium text-sm leading-5`;

      const focusClass = isFocused && !isReadOnly ? "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]" : "";

      const hoverClass = !isReadOnly
        ? "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)"
        : "";

      const readOnlyClass = isReadOnly
        ? "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)"
        : "";

      const errorClass = error ? "border-error-main" : "";

      return `${baseClass} ${focusClass} ${hoverClass} ${readOnlyClass} ${errorClass} focus:outline-none transition-colors`;
    }, [error, isFocused, isReadOnly]);

    const renderLabel = useCallback(() => {
      if (!label) return null;

      return (
        <label htmlFor={name} className={getLabelClass()}>
          {label}
          {field.isMandatory && <span className="text-error-main ml-1">*</span>}
        </label>
      );
    }, [getLabelClass, label, name, field.isMandatory]);

    const renderHelperText = useCallback(() => {
      if (!helperText) return null;

      return (
        <div className="h-0">
          <p className={`text-xs mt-1 ${error ? "text-red-500" : "text-baseline-60"}`}>{helperText}</p>
        </div>
      );
    }, [error, helperText]);

    return (
      <div ref={containerRef} className="w-full font-['Inter'] font-medium">
        {renderLabel()}
        <div className={`relative flex items-center w-full ${isReadOnly ? "pointer-events-none" : ""}`}>
          <input
            type="date"
            id={name}
            name={name}
            ref={handleRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={getInputClass()}
            readOnly={isReadOnly}
            disabled={isReadOnly}
            aria-label={field.name}
            aria-readonly={isReadOnly}
            aria-required={field.isMandatory}
            aria-disabled={isReadOnly}
            aria-details={field.helpComment}
            {...props}
          />
          <button
            type="button"
            onClick={handleCalendarClick}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 transition-colors z-10 flex items-center justify-center ${
              isFocused && !isReadOnly ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
            } ${isReadOnly ? "cursor-not-allowed" : "hover:text-gray-600"}`}
            disabled={isReadOnly}>
            <CalendarIcon className="h-5 w-5" />
          </button>
        </div>
        {renderHelperText()}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;
