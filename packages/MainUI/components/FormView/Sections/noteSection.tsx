import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, IconButton, TextField } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/theme';
import Modal from '@workspaceui/componentlibrary/components/BasicModal';
import CloseIcon from '../../../../ComponentLibrary/src/assets/icons/x.svg';
import NoteIcon from '../../../../ComponentLibrary/src/assets/icons/note.svg';
import PlusIcon from '../../../../ComponentLibrary/src/assets/icons/plus-circle.svg';
import { Note, NoteSectionProps } from '../types';
import { noteColors, sx } from '../styles';

const NoteSection: React.FC<NoteSectionProps> = ({
  sectionId,
  addNoteButtonText,
  modalTitleText,
  modalDescriptionText,
  noteInputPlaceholder,
  addNoteSubmitText,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');

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
      setNewNote('');
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    sessionStorage.setItem(`notes-${sectionId}`, JSON.stringify(updatedNotes));
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Modal
            HeaderIcon={NoteIcon}
            tittleHeader={modalTitleText}
            descriptionText={modalDescriptionText}
            customTrigger={
              <Button sx={sx.addNoteButton}>
                <IconButton>
                  <PlusIcon fill={theme.palette.baselineColor.neutral[80]} />
                </IconButton>
                <Typography variant="body1" sx={sx.addNoteText}>
                  {addNoteButtonText}
                </Typography>
              </Button>
            }>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={noteInputPlaceholder}
            />
            <Button onClick={addNote} variant="contained" sx={{ mt: 2 }}>
              {addNoteSubmitText}
            </Button>
          </Modal>
        </Grid>
        {notes.map(note => (
          <Grid item xs={6} key={note.id}>
            <Card sx={{ ...sx.noteCard, backgroundColor: note.color }}>
              <CardContent sx={sx.noteCardContent}>
                <Box sx={sx.noteContentBox}>
                  <Typography variant="body1" sx={sx.noteContentText}>
                    {note.content}
                  </Typography>
                </Box>
                <Typography variant="body2" component="div" sx={sx.noteDate}>
                  {new Date(note.createdAt).toDateString()}
                </Typography>
                <Box sx={sx.deleteButtonBox}>
                  <IconButton size="small" onClick={() => deleteNote(note.id)}>
                    <CloseIcon fontSize="small" />
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
