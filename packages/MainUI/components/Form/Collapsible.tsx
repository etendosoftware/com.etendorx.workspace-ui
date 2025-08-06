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

"use client";

import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import ChevronUp from "@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg";
import InfoIcon from "@workspaceui/componentlibrary/src/assets/icons/file-text.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import React, { type CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CollapsibleProps } from "./FormView/types";

function CollapsibleCmp({ title, icon, children, isExpanded, sectionId = "", onToggle }: CollapsibleProps) {
  const contentRef = useRef<React.ElementRef<"div">>(null);
  const [maxHeight, setMaxHeight] = useState<CSSProperties["maxHeight"]>("100%");
  const [overflowVisible, setOverflowVisible] = useState(false);
  const style = useMemo(() => ({ maxHeight: isExpanded ? maxHeight : 0 }), [isExpanded, maxHeight]);

  const handleToggle = useCallback(() => {
    if (onToggle) {
      onToggle(!isExpanded);
    }
  }, [isExpanded, onToggle]);

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, children]);

  useEffect(() => {
    if (isExpanded) {
      const timeoutId = setTimeout(() => {
        setOverflowVisible(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
    setOverflowVisible(false);
  }, [isExpanded]);

  useEffect(() => {
    if (!contentRef.current) return;

    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    for (const el of focusableElements) {
      if (isExpanded) {
        if ((el as HTMLElement).dataset.originalTabIndex) {
          (el as HTMLElement).setAttribute("tabindex", (el as HTMLElement).dataset.originalTabIndex || "0");
          delete (el as HTMLElement).dataset.originalTabIndex;
        }
      } else {
        if (!(el as HTMLElement).dataset.originalTabIndex) {
          (el as HTMLElement).dataset.originalTabIndex = (el as HTMLElement).getAttribute("tabindex") || "0";
        }
        (el as HTMLElement).setAttribute("tabindex", "-1");
      }
    }
  }, [isExpanded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleToggle();
        e.preventDefault();
      }
    },
    [handleToggle]
  );

  return (
    <div
      id={`section-${sectionId}`}
      className={`flex flex-col gap-3 bg-white rounded-xl border border-gray-200 ${isExpanded ? "overflow-visible" : "overflow-hidden"}`}>
      <div
        // biome-ignore lint/a11y/useSemanticElements: <explanation>
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${sectionId}`}
        className={`w-full h-12 flex justify-between text-(--color-baseline-90) hover:text-(--color-dynamic-main)
          items-center p-4 cursor-pointer transition-colors hover:bg-(--color-dynamic-contrast-text) bg-gray-50 ${isExpanded ? "rounded-xl" : ""}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-3">
          <IconButton className="[&>svg]:text-[1rem]">{icon || <InfoIcon />}</IconButton>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div>
          <IconButton>{isExpanded ? <ChevronUp /> : <ChevronDown />}</IconButton>
        </div>
      </div>
      <div
        id={`section-content-${sectionId}`}
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${
          overflowVisible ? "overflow-visible" : "overflow-hidden"
        }`}
        style={style}
        aria-hidden={!isExpanded}>
        <div className="px-3 pb-12">
          {React.isValidElement(children) && children.type === "div" ? children : <div>{children}</div>}
        </div>
      </div>
    </div>
  );
}

export const Collapsible = memo(CollapsibleCmp);
export default Collapsible;
