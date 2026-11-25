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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { Box, Button, Typography } from "@mui/material";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import TrashIcon from "@workspaceui/componentlibrary/src/assets/icons/trash.svg";
import { formatClassicDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { useTranslation } from "@/hooks/useTranslation";
import type { Note } from "../types";
import { DATE_DISPLAY, type DateDisplay } from "@/stores/notesPreferencesStore";
import { formatRelativeTime } from "./noteUtils";
import { DELETE_ICON_BUTTON_CLASS, useNoteStyles } from "./noteStyles";

interface NoteItemProps {
  note: Note;
  /** Whether the note belongs to the current user: only then it can be deleted. */
  isOwn: boolean;
  /** False when the tab does not allow changing notes (`DisableNotesForReadOnlyTabs`); defaults to true. */
  canDelete?: boolean;
  /** Whether the deletion of this note is in progress. */
  isDeleting: boolean;
  onDelete: (noteId: string) => Promise<void>;
  /** Whether the creation date is shown as elapsed time in words or as the exact date and time. */
  dateDisplay: DateDisplay;
  /** Current time, in milliseconds, the elapsed time is measured against. */
  now: number;
  /** BCP-47 locale of the user language, used for the elapsed time in words. */
  locale: string;
}

/**
 * Tells whether the clamped text of a note is cut, re-measured when the note is resized. While the
 * note is expanded the last measure is kept, so the "Show less" toggle stays available.
 */
const useIsTextCut = (ref: RefObject<HTMLElement | null>, isCollapsed: boolean, text: string): boolean => {
  const [isCut, setIsCut] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `text` is not read, but a new text must be measured again
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !isCollapsed) return;
    const measure = () => setIsCut(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, isCollapsed, text]);

  return isCut;
};

/**
 * One note of the Notes section: author, creation date (elapsed time in words or exact date and
 * time, the other format in its tooltip) and the full text (line breaks kept). Long notes are cut with
 * a "Show more" toggle. Own notes are tinted and can be deleted after an inline confirmation, which
 * Escape cancels.
 */
const NoteItem = ({ note, isOwn, canDelete = true, isDeleting, onDelete, dateDisplay, now, locale }: NoteItemProps) => {
  const { t } = useTranslation();
  const sx = useNoteStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const isTextCut = useIsTextCut(bodyRef, !isExpanded, note.note);
  const author = note.createdBy.identifier || t("forms.notes.unknownAuthor");
  const exactDate = formatClassicDate(note.creationDate, true);
  const relativeDate = formatRelativeTime(note.creationDate, now, locale);
  const isRelative = dateDisplay === DATE_DISPLAY.RELATIVE;
  const shownDate = isRelative ? relativeDate : exactDate;
  const alternativeDate = isRelative ? exactDate : relativeDate;

  const confirmDelete = async () => {
    await onDelete(note.id);
    setIsConfirming(false);
  };

  const handleConfirmKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      setIsConfirming(false);
    }
  };

  return (
    <Box component="li" sx={isOwn ? sx.ownItem : sx.item} data-testid={`Card__a680f8_${note.id}`}>
      <Box sx={sx.itemHeader} data-testid="Box__ae57cf">
        <Typography variant="body2" sx={sx.author} data-testid="Typography__ae57cf">
          {author}
        </Typography>
        {isOwn && (
          <Typography component="span" sx={sx.youBadge} data-testid="Typography__ae57cf">
            {t("forms.notes.youLabel")}
          </Typography>
        )}
        {shownDate && (
          <Typography
            variant="caption"
            component="time"
            dateTime={note.creationDate}
            title={alternativeDate}
            sx={sx.date}
            data-testid={`Typography__a680f8_date_${note.id}`}>
            {shownDate}
          </Typography>
        )}
        {isOwn && canDelete && !isConfirming && (
          <Box sx={sx.deleteSlot} data-testid={`Box__a680f8_delete_${note.id}`}>
            <IconButton
              ariaLabel={t("forms.notes.deleteNote")}
              tooltip={t("forms.notes.deleteNote")}
              onClick={() => setIsConfirming(true)}
              disabled={isDeleting}
              className={DELETE_ICON_BUTTON_CLASS}
              data-testid="IconButton__a680f8">
              <TrashIcon width={16} height={16} data-testid="TrashIcon__ae57cf" />
            </IconButton>
          </Box>
        )}
      </Box>
      <Typography
        ref={bodyRef}
        variant="body2"
        sx={isExpanded ? sx.body : sx.bodyCollapsed}
        data-testid={`Typography__a680f8_content_${note.id}`}>
        {note.note}
      </Typography>
      {isTextCut && (
        <Button
          size="small"
          variant="text"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((previous) => !previous)}
          sx={sx.toggleButton}
          data-testid={`Button__a680f8_toggle_${note.id}`}>
          {isExpanded ? t("forms.notes.showLess") : t("forms.notes.showMore")}
        </Button>
      )}
      {isConfirming && (
        <Box
          role="alert"
          sx={sx.confirm}
          onKeyDown={handleConfirmKeyDown}
          data-testid={`Box__a680f8_confirm_${note.id}`}>
          <Typography variant="body2" sx={sx.confirmText} data-testid="Typography__ae57cf">
            {t("forms.notes.confirmDeleteInline")}
          </Typography>
          <Button
            size="small"
            autoFocus
            disabled={isDeleting}
            onClick={() => setIsConfirming(false)}
            sx={sx.cancelButton}
            data-testid={`Button__a680f8_cancel_${note.id}`}>
            {t("forms.notes.cancelButton")}
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={isDeleting}
            onClick={confirmDelete}
            sx={sx.deleteButton}
            data-testid={`Button__a680f8_confirm_${note.id}`}>
            {t("forms.notes.deleteButton")}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NoteItem;
