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

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import type { Note, NoteSectionProps } from "../types";
import { fetchNotes, deleteNote, createNote } from "@workspaceui/api-client/src/api/notes";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import NoteComposer from "./NoteComposer";
import NoteItem from "./NoteItem";
import {
  addNoteOnTop,
  getDeleteNoteErrorMessage,
  getRequestErrorMessage,
  isNoteAlreadyDeleted,
  isOwnNote,
  mergeFetchedNotes,
  toUiNote,
} from "./noteUtils";
import { useNoteStyles } from "./noteStyles";

const SKELETON_ROWS = 2;
const SKELETON_HEIGHT = 72;

/**
 * Notes section of a record's form: an inline input to add notes and the list of notes, newest first.
 * Notes are loaded the first time the section is expanded for a record that has notes. Responses of a
 * record the form no longer shows are ignored.
 */
const NoteSection = ({
  noteInputPlaceholder,
  addNoteSubmitText,
  recordId,
  tableId,
  initialNoteCount,
  isSectionExpanded,
  onNotesChange,
  showErrorModal,
}: NoteSectionProps) => {
  const { t } = useTranslation();
  const sx = useNoteStyles();
  const currentUserId = useUserStore((s) => s.user?.id);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const hasLoadedNotesRef = useRef(false);
  // The record the notes on screen belong to: a late response of a previous record is ignored
  const currentRecordRef = useRef(recordId);

  const reportError = useCallback((message: string) => showErrorModal?.(message), [showErrorModal]);

  // Reset when navigating to a different record
  useEffect(() => {
    currentRecordRef.current = recordId;
    hasLoadedNotesRef.current = false;
    setNotes([]);
    setIsFetching(false);
  }, [recordId]);

  useEffect(() => {
    if (!isSectionExpanded || hasLoadedNotesRef.current || initialNoteCount <= 0) return;
    hasLoadedNotesRef.current = true;
    const requestedRecordId = recordId;
    const isCurrentRecord = () => currentRecordRef.current === requestedRecordId;

    setIsFetching(true);
    fetchNotes({ recordId, tableId })
      .then((fetchedNotes) => {
        if (isCurrentRecord()) setNotes((current) => mergeFetchedNotes(fetchedNotes.map(toUiNote), current));
      })
      .catch((error) => {
        console.error("Failed to fetch notes:", error);
        if (isCurrentRecord()) reportError(getRequestErrorMessage(error, t("forms.notes.errorLoadingNotes")));
      })
      .finally(() => {
        if (isCurrentRecord()) setIsFetching(false);
      });
  }, [isSectionExpanded, recordId, tableId, initialNoteCount, t, reportError]);

  const removeNote = (noteId: string) => {
    setNotes((current) => current.filter((note) => note.id !== noteId));
    onNotesChange(); // Refreshes the note count of the section title
  };

  const handleAddNote = async (content: string): Promise<boolean> => {
    const targetRecordId = recordId;
    try {
      const createdNote = await createNote({ recordId, tableId, content });
      if (currentRecordRef.current === targetRecordId) {
        setNotes((current) => addNoteOnTop(toUiNote(createdNote), current));
      }
      onNotesChange();
      return true;
    } catch (error) {
      console.error("Failed to add note:", error);
      reportError(getRequestErrorMessage(error, t("forms.notes.errorAddingNote")));
      return false;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    try {
      await deleteNote(noteId);
      removeNote(noteId);
    } catch (error) {
      console.error("Failed to delete note:", error);
      // A note that no longer exists (deleted from another session) is just removed from the list
      if (isNoteAlreadyDeleted(error)) {
        removeNote(noteId);
      } else {
        reportError(getDeleteNoteErrorMessage(error, t));
      }
    } finally {
      setDeletingNoteId(null);
    }
  };

  const renderNotes = () => {
    // Until the first load completes the section shows placeholders instead of the empty message
    const isWaitingForNotes = isFetching || (initialNoteCount > 0 && !hasLoadedNotesRef.current);
    if (notes.length === 0 && isWaitingForNotes) {
      return (
        <Box aria-busy="true" aria-label={t("forms.notes.loadingNotes")} data-testid="Box__a680f8_loading">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={SKELETON_HEIGHT}
              sx={sx.skeleton}
              data-testid="Skeleton__a680f8"
            />
          ))}
        </Box>
      );
    }
    if (notes.length === 0) {
      return (
        <Typography variant="body2" sx={sx.empty} data-testid="Typography__a680f8_empty">
          {t("forms.notes.emptyState")}
        </Typography>
      );
    }
    return (
      <Box component="ul" sx={sx.list} data-testid="Box__a680f8_list">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isOwn={isOwnNote(note, currentUserId)}
            isDeleting={deletingNoteId === note.id}
            onDelete={handleDeleteNote}
            data-testid="NoteItem__a680f8"
          />
        ))}
      </Box>
    );
  };

  // The content is only rendered while expanded: the collapsed section keeps its children mounted, and
  // a hidden note input would still be reachable with Tab
  if (!isSectionExpanded) {
    return null;
  }

  return (
    <Box sx={sx.container} data-testid="Box__a680f8_1">
      <NoteComposer
        onSubmit={handleAddNote}
        placeholder={noteInputPlaceholder}
        submitLabel={addNoteSubmitText}
        data-testid="NoteComposer__a680f8"
      />
      {renderNotes()}
    </Box>
  );
};

export default NoteSection;
