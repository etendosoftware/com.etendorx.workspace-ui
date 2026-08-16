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

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { sanitizeMessageHtml } from "@/utils/processes/definition/sanitizeHtml";
import { buildHelpSections } from "@/utils/help/buildHelpContent";
import { useTranslation } from "@/hooks/useTranslation";
import { useMetadataContext } from "@/contexts/metadata";
import { useHelpPanelStore } from "@/stores/helpPanelStore";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import ChevronUpIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg";

const ACTIVE_TAB_THRESHOLD_PX = 16;
const PANEL_WIDTH = "42rem";

/**
 * Right-hand panel showing contextual Help for the active window: window-level
 * help text, then a tab index (left) and, for each tab, its help text and field list
 * (right, scrollable). Clicking a tab in the index scrolls its section into view; the
 * index highlights whichever section is currently scrolled to the top of the content
 * pane (plain onScroll + getBoundingClientRect — see Task 8 of the original plan for
 * why this was chosen over IntersectionObserver).
 *
 * Renders as a real flex sibling in `layout.tsx` (not a portal/overlay) so opening it
 * pushes the content column instead of covering it — width-animated like the left-nav
 * `Drawer`, though (unlike that Drawer, which only animates between two non-zero
 * widths) this one collapses fully to 0, so an inner fixed-width wrapper keeps the
 * header/content from visibly squishing mid-transition. Self-sufficient: reads
 * `isOpen` from `useHelpPanelStore` and the active window from `useMetadataContext()`
 * directly, since it has no parent-child relationship with the trigger button
 * (`HelpAccess`, which lives in `Navigation`).
 *
 * Only the OUTER wrapper (the width-animated div) mounts unconditionally — its inner
 * content (header, Close button, tab nav, sections) renders only while `isOpen`. This
 * matters beyond avoiding wasted work: an interactive "Close" button sitting in the DOM
 * at all times, even visually clipped to zero width, is still reachable by broad
 * accessibility-tree queries (e.g. Playwright's `getByRole("button", { name: "Close" })`
 * with no scoping) — it was mistakenly always rendered once, which caused an E2E test to
 * hang clicking a clipped, unhittable button instead of the dialog's own Close button.
 *
 * All rich text is sanitized with `sanitizeMessageHtml` — the locked-down allowlist
 * (no `<a>`, no images) used for admin-authored documentation prose, not
 * `RichTextSelector`'s permissive default DOMPurify call.
 */
const HelpDrawer: React.FC = () => {
  const { t } = useTranslation();
  const { window, windowId } = useMetadataContext();
  const isOpen = useHelpPanelStore((state) => state.isOpen);
  const close = useHelpPanelStore((state) => state.close);

  const sections = window ? buildHelpSections(window) : [];
  const windowHelp = window?.helpComment?.trim() ?? "";

  const contentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const fieldRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const previousWindowId = useRef(windowId);

  // sections' identity changes every render (buildHelpSections returns a new array);
  // reset only when the drawer transitions to open, not on every content recompute.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — reset only on open transition, not on every sections recompute (sections is a new array identity every render)
  useEffect(() => {
    if (isOpen) {
      setActiveTabId(sections[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // A stale window's help content should never linger onscreen after the user
  // navigates away from it while the panel is open.
  useEffect(() => {
    if (isOpen && previousWindowId.current !== windowId) {
      close();
    }
    previousWindowId.current = windowId;
  }, [windowId, isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const scrollToTab = (tabId: string) => {
    sectionRefs.current.get(tabId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToField = (fieldId: string) => {
    fieldRefs.current.get(fieldId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContentScroll = () => {
    const containerTop = contentRef.current?.getBoundingClientRect().top ?? 0;
    let current = sections[0]?.id ?? null;
    for (const tab of sections) {
      const el = sectionRefs.current.get(tab.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top - containerTop;
      if (top <= ACTIVE_TAB_THRESHOLD_PX) {
        current = tab.id;
      } else {
        break;
      }
    }
    setActiveTabId(current);
  };

  return (
    <div
      className="h-full shrink-0 overflow-hidden transition-all duration-500 ease-in-out bg-white border-l border-gray-200 flex flex-col"
      style={{ width: isOpen ? PANEL_WIDTH : "0" }}
      data-testid="help-drawer-panel">
      {isOpen && (
        <div className="w-[42rem] h-full flex flex-col min-h-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold">
              {t("common.helpFor")} {window?.name}
            </h2>
            <button type="button" onClick={close} aria-label={t("common.close")}>
              <CloseIcon className="w-4 h-4" data-testid="CloseIcon__e7d68f" />
            </button>
          </div>
          {windowHelp && (
            <div className="p-4 border-b border-gray-200">
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizeMessageHtml above */}
              <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(windowHelp) }} />
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            <nav
              className="w-48 shrink-0 overflow-y-auto border-r border-gray-200 p-2"
              aria-label={t("common.helpFor")}>
              {sections.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToTab(tab.id)}
                  className={`block w-full text-left px-2 py-1 rounded text-sm ${
                    activeTabId === tab.id ? "bg-gray-100 font-semibold" : ""
                  }`}
                  data-testid={`help-toc-item-${tab.id}`}
                  aria-current={activeTabId === tab.id ? "true" : undefined}>
                  {tab.name}
                </button>
              ))}
            </nav>
            <div
              ref={contentRef}
              onScroll={handleContentScroll}
              className="flex-1 overflow-y-auto p-4 space-y-6"
              data-testid="help-drawer-content">
              {sections.map((tab) => (
                <section
                  key={tab.id}
                  ref={(el) => {
                    if (el) {
                      sectionRefs.current.set(tab.id, el);
                    } else {
                      sectionRefs.current.delete(tab.id);
                    }
                  }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{tab.name}</h3>
                    <button
                      type="button"
                      onClick={scrollToTop}
                      aria-label={t("common.backToTop")}
                      data-testid={`help-back-to-top-${tab.id}`}>
                      <ChevronUpIcon className="w-4 h-4" data-testid={`ChevronUpIcon__${tab.id}`} />
                    </button>
                  </div>
                  {tab.helpComment && (
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizeMessageHtml above
                    <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(tab.helpComment) }} />
                  )}
                  {tab.fields.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm">
                      {tab.fields.map((field) => (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => scrollToField(field.id)}
                          className="text-blue-700 hover:underline"
                          data-testid={`help-field-link-${field.id}`}>
                          [{field.name}]
                        </button>
                      ))}
                    </div>
                  )}
                  {tab.fields.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {tab.fields.map((field) => (
                        <li
                          key={field.id}
                          ref={(el) => {
                            if (el) {
                              fieldRefs.current.set(field.id, el);
                            } else {
                              fieldRefs.current.delete(field.id);
                            }
                          }}>
                          <strong>{field.name}</strong>
                          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via sanitizeMessageHtml above */}
                          <div dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(field.helpComment) }} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpDrawer;
