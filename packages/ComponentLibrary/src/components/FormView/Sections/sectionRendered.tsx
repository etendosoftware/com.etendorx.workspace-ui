import React from 'react';
import FormSection from './FormSection';
import NoteSection from './noteSection';
import { SectionRendererProps } from '../types';

const SectionRenderer: React.FC<SectionRendererProps> = props => {
  const renderSectionContent = () => {
    switch (props.sectionData.id) {
      case 'notes':
        return (
          <NoteSection
            sectionId={props.sectionData.id}
            addNoteButtonText="Add note"
            modalTitleText="Add New Note"
            modalDescriptionText="Enter your note content below"
            noteInputPlaceholder="Enter your note here"
            addNoteSubmitText="Add Note"
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormSection {...props}>
      {props.sectionData.id === 'notes' ? renderSectionContent() : null}
    </FormSection>
  );
};

export default SectionRenderer;
