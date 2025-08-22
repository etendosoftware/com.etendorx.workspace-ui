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
    <Box data-testid="Box__a680f8_1">
      <Grid container spacing={2} data-testid="Grid__a680f8_1">
        <Grid item xs={6} data-testid="Grid__a680f8_trigger">
          <Modal
            HeaderIcon={NoteIcon}
            tittleHeader={modalTitleText}
            descriptionText={modalDescriptionText}
            customTrigger={
              <Button sx={sx.addNoteButton} data-testid="Button__a680f8_add">
                <IconButton data-testid="IconButton__a680f8_add">
                  <PlusIcon fill={theme.palette.baselineColor.neutral[80]} data-testid="PlusIcon__a680f8_add" />
                </IconButton>
                <Typography variant="body1" sx={sx.addNoteText} data-testid="Typography__a680f8_add">
                  {addNoteButtonText}
                </Typography>
              </Button>
            }
            data-testid="Modal__a680f8_add">
            <TextField
              fullWidth
              multiline
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={noteInputPlaceholder}
              data-testid="TextField__a680f8_input"
            />
            <Button onClick={addNote} variant="contained" sx={{ mt: 2 }} data-testid="Button__a680f8_submit">
              {addNoteSubmitText}
            </Button>
          </Modal>
        </Grid>
        {notes.map((note) => (
          <Grid item xs={6} key={note.id} data-testid={`Grid__a680f8_item_${note.id}`}>
            <Card sx={{ ...sx.noteCard, backgroundColor: note.color }} data-testid={`Card__a680f8_${note.id}`}>
              <CardContent sx={sx.noteCardContent} data-testid={`CardContent__a680f8_${note.id}`}>
                <Box sx={sx.noteContentBox} data-testid={`Box__a680f8_${note.id}`}>
                  <Typography
                    variant="body1"
                    sx={sx.noteContentText}
                    data-testid={`Typography__a680f8_content_${note.id}`}>
                    {note.content}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  component="div"
                  sx={sx.noteDate}
                  data-testid={`Typography__a680f8_date_${note.id}`}>
                  {new Date(note.createdAt).toDateString()}
                </Typography>
                <Box sx={sx.deleteButtonBox} data-testid={`Box__a680f8_delete_${note.id}`}>
                  <IconButton onClick={() => deleteNote(note.id)} data-testid={`IconButton__a680f8_delete_${note.id}`}>
                    <CloseIcon fontSize="small" data-testid={`CloseIcon__a680f8_${note.id}`} />
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
