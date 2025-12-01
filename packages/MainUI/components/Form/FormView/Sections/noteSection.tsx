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

import { useState, useEffect, useRef } from "react";
import { Box, Grid, Card, CardContent, Typography, Button, TextField, useTheme } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import NoteIcon from "@workspaceui/componentlibrary/src/assets/icons/note.svg";
import PlusIcon from "@workspaceui/componentlibrary/src/assets/icons/plus-circle.svg";
import type { Note, NoteSectionProps } from "../types";
import { noteColors, useStyle } from "../styles";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { fetchNotes, deleteNote, createNote } from "@workspaceui/api-client/src/api/notes";
import { useTranslation } from "@/hooks/useTranslation";

const NoteSection = ({
  addNoteButtonText,
  modalTitleText,
  modalDescriptionText,
  noteInputPlaceholder,
  addNoteSubmitText,
  recordId,
  tableId,
  initialNoteCount,
  isSectionExpanded,
  onNotesChange,
  showErrorModal,
}: NoteSectionProps) => {
  const { sx } = useStyle();
  const theme = useTheme();
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<string | null>(null);
  const hasLoadedNotesRef = useRef(false);

  const handleAddNote = async () => {
    if (newNote.trim()) {
      setIsLoading(true);
      try {
        const createdNote = await createNote({
          recordId,
          tableId,
          content: newNote, // API expects 'content' in the request
        });

        // Transform the created note to match our UI Note interface
        const transformedNote = {
          id: createdNote.id,
          note: createdNote.note,
          createdBy: {
            id: createdNote.createdBy || "",
            identifier: createdNote.createdBy$_identifier || "Unknown",
          },
          creationDate: createdNote.creationDate,
        };

        // Add to beginning of array so it shows at top
        setNotes((prevNotes) => [transformedNote, ...prevNotes]);
        setNewNote("");
        onNotesChange();

        // Force a small delay to ensure DOM updates
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error("Failed to add note:", error);
        const errorMessage =
          error instanceof Error ? error.message : t("forms.notes.errorAddingNote") || "Failed to add note";
        if (showErrorModal) {
          showErrorModal(errorMessage);
        }
        setIsLoading(false);
      }
    }
  };

  const confirmDeleteNote = (id: string) => {
    setShowDeleteConfirmation(id);
  };

  const executeDeleteNote = async () => {
    if (!showDeleteConfirmation) return;

    setIsLoading(true);
    try {
      await deleteNote(showDeleteConfirmation); // API call to DELETE

      // Update UI by filtering out the deleted note
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== showDeleteConfirmation));
      onNotesChange(); // Notify parent to update the noteCount badge
    } catch (error) {
      console.error("Failed to delete note:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("forms.notes.errorDeletingNote") || "Failed to delete note";
      if (showErrorModal) {
        showErrorModal(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setShowDeleteConfirmation(null); // Close modal
    }
  };

  // Reset hasLoadedNotesRef when recordId changes (navigating to a different record)
  useEffect(() => {
    hasLoadedNotesRef.current = false;
    setNotes([]);
  }, [recordId]);

  useEffect(() => {
    if (isSectionExpanded && !hasLoadedNotesRef.current && initialNoteCount > 0) {
      hasLoadedNotesRef.current = true;
      const loadNotes = async () => {
        setIsLoading(true);
        try {
          const fetchedNotes = await fetchNotes({ recordId, tableId });
          // Transform the API response to match our UI Note interface
          const transformedNotes = fetchedNotes.map((apiNote) => ({
            id: apiNote.id,
            note: apiNote.note,
            createdBy: {
              id: apiNote.createdBy || "",
              identifier: apiNote.createdBy$_identifier || "Unknown",
            },
            creationDate: apiNote.creationDate,
          }));
          setNotes(transformedNotes);
        } catch (error) {
          console.error("Failed to fetch notes:", error);
          const errorMessage =
            error instanceof Error ? error.message : t("forms.notes.errorLoadingNotes") || "Failed to load notes";
          if (showErrorModal) {
            showErrorModal(errorMessage);
          }
        } finally {
          setIsLoading(false);
        }
      };
      loadNotes();
    }
  }, [isSectionExpanded, recordId, tableId, initialNoteCount, t, showErrorModal]);

  return (
    <Box data-testid="Box__a680f8_1">
      {isLoading && isSectionExpanded && (
        <Typography data-testid="Typography__a680f8">{t("forms.notes.loadingNotes")}</Typography>
      )}
      <Grid container spacing={2} data-testid="Grid__a680f8_1">
        <Grid item xs={6} data-testid="Grid__a680f8_trigger">
          <Modal
            HeaderIcon={NoteIcon}
            tittleHeader={modalTitleText || t("forms.notes.addNoteModalTitle")}
            descriptionText={modalDescriptionText || t("forms.notes.addNoteModalDescription")}
            customTrigger={
              <Box sx={sx.addNoteButton} data-testid="Button__a680f8_add">
                <IconButton data-testid="IconButton__a680f8_add">
                  <PlusIcon fill={theme.palette.baselineColor.neutral[80]} data-testid="PlusIcon__a680f8_add" />
                </IconButton>
                <Typography variant="body1" sx={sx.addNoteText} data-testid="Typography__a680f8_add">
                  {addNoteButtonText || t("forms.notes.addNote")}
                </Typography>
              </Box>
            }
            data-testid="Modal__a680f8_add">
            <TextField
              fullWidth
              multiline
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={noteInputPlaceholder || t("forms.notes.noteInputPlaceholder")}
              inputProps={{ maxLength: 2000 }}
              helperText={`${newNote.length}/2000`}
              data-testid="TextField__a680f8_input"
            />
            <Button onClick={handleAddNote} variant="contained" sx={{ mt: 2 }} data-testid="Button__a680f8_submit">
              {addNoteSubmitText || t("forms.notes.addNoteSubmit")}
            </Button>
          </Modal>
        </Grid>

        {isSectionExpanded &&
          notes.map((note, index) => (
            <Grid item xs={6} key={note.id} data-testid={`Grid__a680f8_item_${note.id}`}>
              <Card
                sx={{ ...sx.noteCard, backgroundColor: noteColors[index % noteColors.length] }}
                data-testid={`Card__a680f8_${note.id}`}>
                <CardContent sx={sx.noteCardContent} data-testid={`CardContent__a680f8_${note.id}`}>
                  <Box sx={sx.noteContentBox} data-testid={`Box__a680f8_${note.id}`}>
                    <Typography variant="body1" data-testid={`Typography__a680f8_content_${note.id}`}>
                      {note.note}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={sx.noteDate} data-testid={`Typography__a680f8_date_${note.id}`}>
                    {`${t("forms.notes.createdBy")}: ${note.createdBy.identifier} - ${new Date(note.creationDate).toLocaleDateString()}`}
                  </Typography>
                  <Box sx={sx.deleteButtonBox} data-testid={`Box__a680f8_delete_${note.id}`}>
                    <IconButton
                      onClick={() => confirmDeleteNote(note.id)}
                      disabled={isLoading}
                      data-testid="IconButton__a680f8">
                      <CloseIcon fontSize="small" data-testid={`CloseIcon__a680f8_${note.id}`} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
      <ConfirmModal
        open={!!showDeleteConfirmation}
        confirmText={t("forms.notes.confirmDeleteMessage")}
        onConfirm={executeDeleteNote}
        onCancel={() => setShowDeleteConfirmation(null)}
        saveLabel={t("forms.notes.deleteButton")}
        secondaryButtonLabel={t("forms.notes.cancelButton")}
        data-testid="ConfirmModal__a680f8"
      />
    </Box>
  );
};

export default NoteSection;
