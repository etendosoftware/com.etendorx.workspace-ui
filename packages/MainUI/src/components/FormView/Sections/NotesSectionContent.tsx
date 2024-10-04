import NoteSection from './noteSection';

export const NotesSectionContent = (props: { id: string }) => {
  return (
    <NoteSection
      sectionId={props.id}
      addNoteButtonText="Add note"
      modalTitleText="Add New Note"
      modalDescriptionText="Enter your note content below"
      noteInputPlaceholder="Enter your note here"
      addNoteSubmitText="Add Note"
    />
  );
};
