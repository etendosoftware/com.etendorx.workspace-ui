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

import { useState, useEffect } from "react";
import { Box, Grid, Card, CardContent, Typography, Button, TextField, useTheme } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import NoteIcon from "@workspaceui/componentlibrary/src/assets/icons/note.svg";
import PlusIcon from "@workspaceui/componentlibrary/src/assets/icons/plus-circle.svg";
import type { Note, NoteSectionProps } from "../types";
import { noteColors, useStyle } from "../styles";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

const NoteSection = ({
  sectionId,
  addNoteButtonText,
  modalTitleText,
  modalDescriptionText,
  noteInputPlaceholder,
  addNoteSubmitText,
}: NoteSectionProps) => {
  const { sx } = useStyle();
  const theme = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const storedNotes = sessionStorage.getItem(`notes-${sectionId}`);
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
  }, [sectionId]);

  const getRandomColor = () => {
    const colors = noteColors;
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addNote = () => {
    if (newNote.trim()) {
      const newNoteObj: Note = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toISOString(),
        color: getRandomColor(),
      };
      const updatedNotes = [...notes, newNoteObj];
      setNotes(updatedNotes);
      sessionStorage.setItem(`notes-${sectionId}`, JSON.stringify(updatedNotes));
      setNewNote("");
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    sessionStorage.setItem(`notes-${sectionId}`, JSON.stringify(updatedNotes));
  };

  return (
    <Box data-testid="Box__a680f8">
      <Grid container spacing={2} data-testid="Grid__a680f8">
        <Grid item xs={6} data-testid="Grid__a680f8">
          <Modal
            HeaderIcon={NoteIcon}
            tittleHeader={modalTitleText}
            descriptionText={modalDescriptionText}
            customTrigger={
              <Button sx={sx.addNoteButton} data-testid="Button__a680f8">
                <IconButton data-testid="IconButton__a680f8">
                  <PlusIcon fill={theme.palette.baselineColor.neutral[80]} data-testid="PlusIcon__a680f8" />
                </IconButton>
                <Typography variant="body1" sx={sx.addNoteText} data-testid="Typography__a680f8">
                  {addNoteButtonText}
                </Typography>
              </Button>
            }
            data-testid="Modal__a680f8">
            <TextField
              fullWidth
              multiline
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={noteInputPlaceholder}
              data-testid="TextField__a680f8"
            />
            <Button onClick={addNote} variant="contained" sx={{ mt: 2 }} data-testid="Button__a680f8">
              {addNoteSubmitText}
            </Button>
          </Modal>
        </Grid>
        {notes.map((note) => (
          <Grid item xs={6} key={note.id} data-testid="Grid__a680f8">
            <Card sx={{ ...sx.noteCard, backgroundColor: note.color }} data-testid="Card__a680f8">
              <CardContent sx={sx.noteCardContent} data-testid="CardContent__a680f8">
                <Box sx={sx.noteContentBox} data-testid="Box__a680f8">
                  <Typography variant="body1" sx={sx.noteContentText} data-testid="Typography__a680f8">
                    {note.content}
                  </Typography>
                </Box>
                <Typography variant="body2" component="div" sx={sx.noteDate} data-testid="Typography__a680f8">
                  {new Date(note.createdAt).toDateString()}
                </Typography>
                <Box sx={sx.deleteButtonBox} data-testid="Box__a680f8">
                  <IconButton onClick={() => deleteNote(note.id)} data-testid="IconButton__a680f8">
                    <CloseIcon fontSize="small" data-testid="CloseIcon__a680f8" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default NoteSection;
