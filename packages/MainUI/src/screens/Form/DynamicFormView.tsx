import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';
import { useWindow } from '@workspaceui/etendohookbinder/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import { FieldDefinition, FormData, Section } from './types';
import { adaptFormData, mapWindowMetadata } from '../../utils/formUtils';
import { MappedData } from '@workspaceui/etendohookbinder/api/types';
import { TabItem } from '@workspaceui/componentlibrary/components/PrimaryTab/types';
import { Box, Grid } from '@workspaceui/componentlibrary/components';
import PrimaryTabs from '@workspaceui/componentlibrary/components/PrimaryTab';
import FormSection from '../../components/FormView/Sections/FormSection';
import { NotesSectionContent } from '../../components/FormView/Sections/NotesSectionContent';
import { FieldValue } from '../../components/FormView/types';
import { defaultIcon } from '../../constants/iconConstants';

export default function DynamicFormView() {
  const { windowId = '', recordId } = useParams<{
    windowId: string;
    recordId: string;
  }>();
  const navigate = useNavigate();
  const { windowData, loading: windowLoading, error: windowError } = useWindow(windowId);
  const [formData, setFormData] = useState<FormData>({});
  const [mappedMetadata, setMappedMetadata] = useState<MappedData | null>(null);

  const query = useMemo(
    () => ({
      criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
    }),
    [recordId],
  );

  const {
    records,
    loading: recordLoading,
    error: recordError,
    loaded,
  } = useDatasource(windowData?.tabs[0].entityName ?? '', query);

  useEffect(() => {
    if (windowData && records && records.length > 0) {
      const newFormData = adaptFormData(windowData, records[0]);
      if (newFormData) setFormData(newFormData);

      const newMappedMetadata = mapWindowMetadata(windowData);
      setMappedMetadata(newMappedMetadata);
    }
  }, [windowData, records]);

  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  const handleChange = useCallback((updatedData: FormData) => {
    setFormData(updatedData);
  }, []);

  const onChange = handleChange;
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs: TabItem[] = useMemo(() => {
    return Object.values(formData)
      .filter((field): field is Section => field.type === 'section')
      .map(section => ({
        id: section.id,
        icon: section.icon,
        label: section.label,
        fill: section.fill,
        hoverFill: section.hoverFill,
        showInTab: section.showInTab,
      }));
  }, [formData]);

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

  const handleInputChange = useCallback(
    (name: string, value: FieldValue) => {
      setFormData(prevData => ({
        ...prevData,
        [name]: {
          ...prevData[name],
          value: value,
        } as FieldDefinition,
      }));
      onChange?.(formData);
    },
    [formData, onChange],
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const groupedFields = useMemo(
    () =>
      Object.entries(formData).reduce(
        (acc, [key, value]) => {
          if ('section' in value) {
            const section = value.section ?? '_mainSection';
            if (!acc[section]) acc[section] = [];
            acc[section].push([key, value]);
          }
          return acc;
        },
        {} as { [key: string]: [string, FieldDefinition][] },
      ),
    [formData],
  );

  if (windowLoading || (recordLoading && !loaded)) return <Spinner />;
  if (windowError) return <div>Error loading window data: {windowError.message}</div>;
  if (recordError) return <div>Error loading record data: {recordError.message}</div>;
  if (!windowData) return <div>No window data available</div>;
  if (!records || records.length === 0) return <div>No record found</div>;
  if (!formData || !mappedMetadata) return <div>No form data available</div>;

  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%" padding="0 0.5rem 0.5rem 0.5rem">
      <Box flexShrink={1}>
        <PrimaryTabs tabs={tabs} onChange={handleTabChange} icon={defaultIcon} />
      </Box>
      <Box flexGrow={1} overflow="auto" ref={containerRef}>
        <form onSubmit={handleSubmit}>
          <Grid container>
            {Object.entries(groupedFields).map(([sectionName, fields]) => {
              const sectionData = formData[sectionName] as Section;
              if (!sectionData || sectionData.type !== 'section') {
                console.warn(`Section ${sectionName} is not properly defined`);
                return null;
              }
              return (
                <FormSection
                  key={sectionName}
                  sectionName={sectionName}
                  sectionData={sectionData}
                  fields={fields}
                  isExpanded={expandedSections.includes(sectionData.id)}
                  onAccordionChange={handleAccordionChange}
                  onHover={setHoveredSection}
                  hoveredSection={hoveredSection}
                  onInputChange={handleInputChange}
                  sectionRef={el => (sectionRefs.current[sectionData.id] = el)}>
                  {sectionData.id === 'notes' ? <NotesSectionContent id={sectionData.id} /> : null}
                </FormSection>
              );
            })}
          </Grid>
        </form>
      </Box>
    </Box>
  );
}
