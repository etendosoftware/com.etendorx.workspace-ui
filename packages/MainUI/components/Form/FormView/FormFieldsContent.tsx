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

import { useFormContext } from "react-hook-form";
import { useUserContext } from "@/hooks/useUserContext";
import type { FormMode, Field, Tab } from "@workspaceui/api-client/src/api/types";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import Collapsible from "@/components/Form/Collapsible";
import { BaseSelector, compileExpression } from "./selectors/BaseSelector";
import { useFormViewContext } from "./contexts/FormViewContext";
import { useRef, useEffect } from "react";

interface FormFieldsProps {
  tab: Tab;
  mode: FormMode;
  groups: Array<[string | null, { identifier: string; fields: Record<string, Field> }]>;
  loading: boolean;
}

export function FormFields({ mode, groups, loading }: FormFieldsProps) {
  const { watch } = useFormContext();
  const { session } = useUserContext();
  const { expandedSections, selectedTab, handleSectionRef, handleAccordionChange, isSectionExpanded, getIconForGroup } =
    useFormViewContext();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTab && containerRef.current) {
      const sectionRefs = containerRef.current.querySelectorAll("[data-section-id]");
      const targetSection = Array.from(sectionRefs).find(
        (section) => section.getAttribute("data-section-id") === selectedTab
      ) as HTMLElement;

      if (targetSection) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const sectionRect = targetSection.getBoundingClientRect();
        const sectionTop = sectionRect.top - containerRect.top + containerRef.current.scrollTop;

        containerRef.current.scrollTo({
          top: Math.max(0, sectionTop - 20),
          behavior: "smooth",
        });
      }
    }
  }, [selectedTab, expandedSections]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-2 flex-grow overflow-auto" ref={containerRef}>
      {groups.map(([id, group]) => {
        const sectionId = String(id || "_main");

        const hasVisibleFields = Object.values(group.fields).some((field) => {
          if (!field.displayed) return false;
          if (!field.displayLogicExpression) return true;

          const compiledExpr = compileExpression(field.displayLogicExpression);
          try {
            return compiledExpr(session, watch());
          } catch (error) {
            console.warn("Error executing expression:", field.displayLogicExpression, error);
            return true;
          }
        });

        if (!hasVisibleFields) {
          return null;
        }

        return (
          <div key={sectionId} ref={handleSectionRef(id)} data-section-id={sectionId}>
            <Collapsible
              title={group.identifier}
              isExpanded={isSectionExpanded(id)}
              sectionId={sectionId}
              icon={getIconForGroup(group.identifier)}
              onToggle={(isOpen: boolean) => handleAccordionChange(id, isOpen)}>
              <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2">
                {Object.entries(group.fields).map(([hqlName, field]) => (
                  <BaseSelector field={field} key={hqlName} formMode={mode} />
                ))}
              </div>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
}
