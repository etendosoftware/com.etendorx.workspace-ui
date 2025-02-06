import React, { useCallback, useMemo, useState, useRef, useEffect, createContext } from 'react';
import { Box, Grid, useTheme } from '@mui/material';
import { FormViewProps } from './types';
import PrimaryTabs from '../PrimaryTab';
import { TabItem } from '../PrimaryTab/types';
import SectionRenderer from './Sections/sectionRendered';
import type { Section } from './types';
import Chevrons from '../../assets/icons/chevrons-right.svg';
import { FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';

export const FormViewContext = createContext({
  sessionAttributes: {} as FormViewProps['sessionAttributes'],
  auxiliaryInputValues: {} as FormViewProps['auxiliaryInputValues'],
});

const FormView: React.FC<FormViewProps> = ({
  data,
  readOnly = false,
  gridItemProps,
  dottedLineInterval,
  onLabelClick,
  tab,
  sessionAttributes,
  auxiliaryInputValues,
}) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const defaultIcon = useMemo(
    () => <Chevrons fill={theme.palette.baselineColor.neutral[80]} />,
    [theme.palette.baselineColor.neutral],
  );

  const tabs: TabItem[] = useMemo(() => {
    return Object.values(data)
      .filter((field): field is Section => field.type === 'section')
      .map(section => ({
        id: section.id,
        icon: section.icon,
        label: section.label,
        fill: section.fill,
        hoverFill: section.hoverFill,
        showInTab: section.showInTab,
      }));
  }, [data]);

  const handleTabChange = useCallback((newTabId: string) => {
    setSelectedTab(newTabId);
    setExpandedSections(prev => {
      if (!prev.includes(newTabId)) {
        return [...prev, newTabId];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    setExpandedSections(tabs.map(tab => tab.id));
    setSelectedTab(tabs[0]?.id || '');
  }, [tabs]);

  useEffect(() => {
    if (selectedTab && containerRef.current) {
      const sectionElement = sectionRefs.current[selectedTab];
      if (sectionElement) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const sectionRect = sectionElement.getBoundingClientRect();

        const sectionBottom = sectionRect.bottom - containerRect.top + containerRef.current.scrollTop;
        const scrollAmount = sectionBottom - containerRect.height + 50;

        containerRef.current.scrollTo({
          top: Math.max(0, scrollAmount),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedTab, expandedSections]);

  const handleAccordionChange = useCallback((sectionId: string, isExpanded: boolean) => {
    setExpandedSections(prev => {
      if (isExpanded) {
        return [...prev, sectionId];
      }
      return prev.filter(id => id !== sectionId);
    });

    if (isExpanded) {
      setSelectedTab(sectionId);
    }
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const groupedFields = useMemo(
    () =>
      Object.entries(data).reduce((acc, [key, value]) => {
        if ('section' in value) {
          const section = value.section ?? '_mainSection';
          if (!acc[section]) acc[section] = [];
          acc[section].push([key, value]);
        }
        return acc;
      }, {} as { [key: string]: [string, FieldDefinition][] }),
    [data],
  );

  const handleSectionRef = useCallback(
    (sectionData: Section) => (el: HTMLElement | null) => {
      sectionRefs.current[sectionData.id] = el;
    },
    [],
  );

  return (
    <FormViewContext.Provider value={{ sessionAttributes, auxiliaryInputValues }}>
      <Box display="flex" flexDirection="column" height="100%" width="100%" padding="0 0 0.5rem 0.5rem">
        <Box flexShrink={1}>
          <PrimaryTabs tabs={tabs} onChange={handleTabChange} icon={defaultIcon} />
        </Box>
        <Box flexGrow={1} overflow="auto" ref={containerRef}>
          <form onSubmit={handleSubmit}>
            <Grid container>
              {Object.entries(groupedFields).map(([sectionName, fields]) => {
                const sectionData = data[sectionName] as Section;
                if (!sectionData || sectionData.type !== 'section') {
                  console.warn(`Section ${sectionName} is not properly defined`);
                  return null;
                }

                return (
                  <SectionRenderer
                    key={sectionData.id}
                    sectionName={sectionName}
                    sectionData={sectionData}
                    fields={fields}
                    isExpanded={expandedSections.includes(sectionData.id)}
                    onAccordionChange={handleAccordionChange}
                    onHover={setHoveredSection}
                    hoveredSection={hoveredSection}
                    sectionRef={handleSectionRef(sectionData)}
                    gridItemProps={gridItemProps}
                    dottedLineInterval={dottedLineInterval}
                    readOnly={readOnly}
                    onLabelClick={onLabelClick}
                    tab={tab}
                  />
                );
              })}
            </Grid>
          </form>
        </Box>
      </Box>
    </FormViewContext.Provider>
  );
};

export default FormView;
