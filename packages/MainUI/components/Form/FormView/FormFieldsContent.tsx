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
import { useRef, useEffect, useState } from "react";
import NoteIcon from "@workspaceui/componentlibrary/src/assets/icons/note.svg";
import AttachmentIcon from "@workspaceui/componentlibrary/src/assets/icons/paperclip.svg";
import NoteSection from "./Sections/noteSection";
import AttachmentSection from "./Sections/AttachmentSection";

interface FormFieldsProps {
  tab: Tab;
  mode: FormMode;
  groups: Array<[string | null, { identifier: string; fields: Record<string, Field> }]>;
  loading: boolean;
  recordId: string;
  initialNoteCount: number;
  initialAttachmentCount: number;
  onNotesChange: () => void;
  onAttachmentsChange: () => void;
  showErrorModal?: (message: string) => void;
  openAttachmentModal?: boolean;
  onAttachmentModalClose?: () => void;
}

export function FormFields({
  tab,
  mode,
  groups,
  loading,
  recordId,
  initialNoteCount,
  initialAttachmentCount,
  onNotesChange,
  onAttachmentsChange,
  showErrorModal,
  openAttachmentModal = false,
  onAttachmentModalClose,
}: FormFieldsProps) {
  const { watch } = useFormContext();
  const { session } = useUserContext();
  const [noteCount, setNoteCount] = useState(initialNoteCount);
  const [attachmentCount, setAttachmentCount] = useState(initialAttachmentCount);
  const { expandedSections, selectedTab, handleSectionRef, handleAccordionChange, isSectionExpanded, getIconForGroup } =
    useFormViewContext();

  const containerRef = useRef<HTMLDivElement>(null);

  // Update local noteCount when initialNoteCount changes
  useEffect(() => {
    setNoteCount(initialNoteCount);
  }, [initialNoteCount]);

  // Update local attachmentCount when initialAttachmentCount changes
  useEffect(() => {
    setAttachmentCount(initialAttachmentCount);
  }, [initialAttachmentCount]);

  // Scroll to attachments section when modal is opened from toolbar
  useEffect(() => {
    if (openAttachmentModal && containerRef.current) {
      const sectionRefs = containerRef.current.querySelectorAll("[data-section-id]");
      const attachmentSection = Array.from(sectionRefs).find(
        (section) => section.getAttribute("data-section-id") === "attachments_group"
      ) as HTMLElement;

      if (attachmentSection) {
        // Expand the section first
        if (!isSectionExpanded("attachments_group")) {
          handleAccordionChange("attachments_group", true);
        }

        // Then scroll to it
        setTimeout(() => {
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const sectionRect = attachmentSection.getBoundingClientRect();
            const sectionTop = sectionRect.top - containerRect.top + containerRef.current.scrollTop;

            containerRef.current.scrollTo({
              top: sectionTop - 20,
              behavior: "smooth",
            });
          }
        }, 100);
      }
    }
  }, [openAttachmentModal, handleAccordionChange, isSectionExpanded]);

  /** Scroll to selected tab */
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
    return <Spinner data-testid="Spinner__38e4a6" />;
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
              onToggle={(isOpen: boolean) => handleAccordionChange(id, isOpen)}
              data-testid="Collapsible__38e4a6">
              <div className="grid auto-rows-auto grid-cols-3 gap-x-5 gap-y-2">
                {Object.entries(group.fields).map(([hqlName, field]) => (
                  <BaseSelector field={field} key={hqlName} formMode={mode} data-testid="BaseSelector__38e4a6" />
                ))}
              </div>
            </Collapsible>
          </div>
        );
      })}
      {/* Notes Section */}
      <div ref={handleSectionRef("notes_group")} data-section-id="notes_group">
        <Collapsible
          title={noteCount > 0 ? `Notes (${noteCount})` : "Notes"}
          isExpanded={isSectionExpanded("notes_group")}
          sectionId="notes_group"
          icon={<NoteIcon data-testid="NoteIcon__38e4a6" />}
          onToggle={(isOpen: boolean) => handleAccordionChange("notes_group", isOpen)}
          data-testid="Collapsible__38e4a6">
          <NoteSection
            sectionId="notes_group"
            addNoteButtonText={undefined}
            modalTitleText={undefined}
            modalDescriptionText={undefined}
            noteInputPlaceholder={undefined}
            addNoteSubmitText={undefined}
            recordId={recordId}
            tableId={tab.table}
            initialNoteCount={noteCount}
            isSectionExpanded={isSectionExpanded("notes_group")}
            onNotesChange={onNotesChange}
            showErrorModal={showErrorModal}
            data-testid="NoteSection__38e4a6"
          />
        </Collapsible>
      </div>
      {/* Attachments Section */}
      <div ref={handleSectionRef("attachments_group")} data-section-id="attachments_group">
        <Collapsible
          title={attachmentCount > 0 ? `Attachments (${attachmentCount})` : "Attachments"}
          isExpanded={isSectionExpanded("attachments_group")}
          sectionId="attachments_group"
          icon={<AttachmentIcon data-testid="AttachmentIcon__attachments" />}
          onToggle={(isOpen: boolean) => handleAccordionChange("attachments_group", isOpen)}
          data-testid="Collapsible__attachments">
          <AttachmentSection
            recordId={recordId}
            tabId={tab.id}
            initialAttachmentCount={attachmentCount}
            isSectionExpanded={isSectionExpanded("attachments_group")}
            onAttachmentsChange={onAttachmentsChange}
            showErrorModal={showErrorModal}
            openAddModal={openAttachmentModal}
            onAddModalClose={onAttachmentModalClose}
            data-testid="AttachmentSection__attachments"
          />
        </Collapsible>
      </div>
    </div>
  );
}
