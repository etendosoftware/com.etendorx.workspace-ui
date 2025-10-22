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
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import type { CollapsibleProps } from "./FormView/types";

function CollapsibleCmp({ title, icon, children, isExpanded, sectionId = "", onToggle }: CollapsibleProps) {
  const contentRef = useRef<React.ElementRef<"div">>(null);
  const innerContentRef = useRef<React.ElementRef<"div">>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = useCallback(() => {
    if (onToggle && !isAnimating) {
      onToggle(!isExpanded);
    }
  }, [isExpanded, onToggle, isAnimating]);

  // Calculate content height and observe changes
  useEffect(() => {
    if (!innerContentRef.current) return;

    const updateHeight = () => {
      if (innerContentRef.current) {
        const height = innerContentRef.current.scrollHeight;
        setContentHeight(height);
      }
    };

    // Calculate initial height
    updateHeight();

    // Observe changes in content size
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(innerContentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, isExpanded]);

  // Handle animation
  useEffect(() => {
    if (!contentRef.current) return;

    setIsAnimating(true);

    const timeoutId = setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isExpanded]);

  // Manage focusability of inner elements based on expansion state
  useEffect(() => {
    if (!innerContentRef.current) return;

    const focusableElements = innerContentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    for (const el of focusableElements) {
      const element = el as HTMLElement;

      if (isExpanded) {
        // Restore original tabindex
        if (element.dataset.originalTabIndex) {
          element.setAttribute("tabindex", element.dataset.originalTabIndex);
          delete element.dataset.originalTabIndex;
        }
      } else {
        // Save original tabindex and disable it
        if (!element.dataset.originalTabIndex) {
          element.dataset.originalTabIndex = element.getAttribute("tabindex") || "0";
        }
        element.setAttribute("tabindex", "-1");
      }
    }
  }, [isExpanded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div id={`section-${sectionId}`} className="flex flex-col bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div
        aria-expanded={isExpanded}
        aria-controls={`section-content-${sectionId}`}
        className={`w-full h-12 flex justify-between text-gray-900 hover:text-blue-600
           items-center p-4 cursor-pointer transition-colors hover:bg-gray-50 bg-gray-50 
           ${isExpanded ? "rounded-t-xl" : "rounded-xl"}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-3">
          <IconButton className="[&>svg]:text-[1rem]" data-testid="IconButton__650187_1">
            {icon || <InfoIcon data-testid="InfoIcon__650187_1" />}
          </IconButton>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div>
          <IconButton data-testid="IconButton__650187_2">
            {isExpanded ? (
              <ChevronUp data-testid="ChevronUp__650187_1" />
            ) : (
              <ChevronDown data-testid="ChevronDown__650187_1" />
            )}
          </IconButton>
        </div>
      </div>

      {/* Content */}
      <div
        id={`section-content-${sectionId}`}
        ref={contentRef}
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          height: isExpanded ? `${contentHeight}px` : "0px",
        }}
        aria-hidden={!isExpanded}>
        <div ref={innerContentRef} className="px-3 pb-3">
          {React.isValidElement(children) && children.type === "div" ? children : <div>{children}</div>}
        </div>
      </div>
    </div>
  );
}

export const Collapsible = memo(CollapsibleCmp);
export default Collapsible;
