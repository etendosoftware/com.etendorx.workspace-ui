import { memo, useCallback, useMemo } from 'react';
import { FieldGroup } from '@/hooks/useFormFields';
import Collapsible from '../../Collapsible';
import BaseSelector from '../selectors/BaseSelector';
import { FormMode } from '@workspaceui/etendohookbinder/src/api/types';

export interface GroupSectionProps {
  id: string;
  group: FieldGroup;
  handleSectionRef: (sectionId: string | null) => (el: HTMLElement | null) => void;
  handleAccordionChange: (sectionId: string | null, isExpanded: boolean) => void;
  handleHover: (sectionName: string | null) => void;
  hoveredSection: string | null;
  isSectionExpanded: (sectionId: string | null) => boolean;
  getIconForGroup: (identifier: string) => React.ReactNode;
  mode: FormMode;
}

export const GroupSection = memo(function GroupSection({
  id,
  group,
  handleSectionRef,
  handleAccordionChange,
  handleHover,
  hoveredSection,
  isSectionExpanded,
  getIconForGroup,
  mode,
}: GroupSectionProps) {
  const sectionId = useMemo(() => String(id || '_main'), [id]);
  const handleRef = useMemo(() => handleSectionRef(id), [handleSectionRef, id]);
  const initialState = useMemo(() => isSectionExpanded(id), [id, isSectionExpanded]);
  const icon = useMemo(() => getIconForGroup(group.identifier), [getIconForGroup, group.identifier]);
  const isHovered = useMemo(() => hoveredSection === group.identifier, [group.identifier, hoveredSection]);
  const handleToggle = useCallback((isOpen: boolean) => handleAccordionChange(id, isOpen), [handleAccordionChange, id]);

  return (
    <div key={sectionId} ref={handleRef}>
      <Collapsible
        title={group.identifier}
        initialState={initialState}
        sectionId={sectionId}
        onHover={handleHover}
        isHovered={isHovered}
        icon={icon}
        onToggle={handleToggle}>
        <div className="grid grid-cols-3 auto-rows-auto gap-4">
          {Object.entries(group.fields).map(([hqlName, field]) => (
            <BaseSelector field={field} key={hqlName} formMode={mode} />
          ))}
        </div>
      </Collapsible>
    </div>
  );
});

export default GroupSection;
