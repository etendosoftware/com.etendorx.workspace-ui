import { Toolbar } from '@/components/Toolbar/Toolbar';
import { EntityData, FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormAction } from '@/hooks/useFormAction';
import { useRouter } from 'next/navigation';
import StatusBar from './StatusBar';
import useFormFields from '@/hooks/useFormFields';
import PrimaryTabs from '@workspaceui/componentlibrary/src/components/PrimaryTab';
import { TabItem } from '@workspaceui/componentlibrary/src/components/PrimaryTab/types';
import { useTheme } from '@mui/material';
import { FormViewProps } from './types';
import { useStatusModal } from '@/hooks/Toolbar/useStatusModal';
import StatusModal from '@workspaceui/componentlibrary/src/components/StatusModal';
import GroupSection from './Sections';
import { DefaultIcon, getIconForGroup } from './Sections/utils';

export default function FormView({ window: windowMetadata, tab, mode, initialState }: FormViewProps) {
  const router = useRouter();
  const theme = useTheme();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(['null']);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const { statusModal, showSuccessModal, showErrorModal, hideStatusModal } = useStatusModal();

  const { fields, groups } = useFormFields(tab);
  const { reset, setValue, ...form } = useForm({ values: initialState });

  const tabs: TabItem[] = useMemo(() => {
    return groups.map(([id, group]) => ({
      id: String(id || '_main'),
      icon: getIconForGroup(group.identifier),
      label: group.identifier,
      fill: theme.palette.baselineColor.neutral[80],
      hoverFill: theme.palette.baselineColor.neutral[0],
      showInTab: true,
    }));
  }, [groups, theme.palette.baselineColor.neutral]);

  const handleTabChange = useCallback((newTabId: string) => {
    setSelectedTab(newTabId);
    setExpandedSections(prev => {
      if (!prev.includes(newTabId)) {
        return [...prev, newTabId];
      }
      return prev;
    });
  }, []);

  const handleSectionRef = useCallback(
    (sectionId: string | null) => (el: HTMLElement | null) => {
      const id = String(sectionId || '_main');
      sectionRefs.current[id] = el;
    },
    [],
  );

  const handleAccordionChange = useCallback((sectionId: string | null, isExpanded: boolean) => {
    const id = String(sectionId || '_main');

    setExpandedSections(prev => {
      if (isExpanded) {
        return [...prev, id];
      }
      return prev.filter(existingId => existingId !== id);
    });

    if (isExpanded) {
      setSelectedTab(id);
    }
  }, []);

  const onSuccess = useCallback(
    async (data: EntityData) => {
      if (mode === FormMode.EDIT) {
        reset({ ...initialState, ...data });
      } else {
        router.replace(String(data.id));
      }
      showSuccessModal('Saved');
    },
    [initialState, mode, reset, router, showSuccessModal],
  );

  const onError = useCallback(
    (data: string) => {
      showErrorModal(data);
    },
    [showErrorModal],
  );

  const { save, loading } = useFormAction({
    windowMetadata,
    tab,
    mode,
    onSuccess,
    onError,
    initialState,
    submit: form.handleSubmit,
  });

  const handleHover = useCallback((sectionName: string | null) => {
    setHoveredSection(sectionName);
  }, []);

  const isSectionExpanded = useCallback(
    (sectionId: string | null) => {
      const id = String(sectionId);
      return expandedSections.includes(id);
    },
    [expandedSections],
  );

  useEffect(() => {
    if (selectedTab && containerRef.current) {
      const sectionElement = sectionRefs.current[selectedTab];
      if (sectionElement) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const sectionRect = sectionElement.getBoundingClientRect();

        const sectionTop = sectionRect.top - containerRect.top + containerRef.current.scrollTop;

        containerRef.current.scrollTo({
          top: Math.max(0, sectionTop - 20),
          behavior: 'smooth',
        });
      }
    }
  }, [selectedTab, expandedSections]);

  return (
    <FormProvider setValue={setValue} reset={reset} {...form}>
      <form
        className={`w-full h-full flex flex-col transition duration-300  ${
          loading ? 'opacity-50 select-none cursor-progress cursor-to-children' : ''
        }`}
        onSubmit={save}>
        <div className="pl-2 pr-2">
          <Toolbar windowId={windowMetadata.id} tabId={tab.id} isFormView={true} onSave={save} />
        </div>
        <div className="flex-shrink-0 pl-2 pr-2">
          <div className="mb-2">
            {statusModal.open && (
              <StatusModal
                statusType={statusModal.statusType}
                statusText={statusModal.statusText}
                errorMessage={statusModal.errorMessage}
                saveLabel={statusModal.saveLabel}
                secondaryButtonLabel={statusModal.secondaryButtonLabel}
                onClose={hideStatusModal}
                isDeleteSuccess={statusModal.isDeleteSuccess}
              />
            )}
          </div>
          <StatusBar fields={fields.statusBarFields} />
          <div className="mt-2">
            <PrimaryTabs tabs={tabs} onChange={handleTabChange} selectedTab={selectedTab} icon={<DefaultIcon />} />
          </div>
        </div>
        <div className="flex-grow overflow-auto p-2 space-y-2" ref={containerRef}>
          {groups.map(([id, group]) => (
            <GroupSection
              key={id}
              id={id}
              group={group}
              handleSectionRef={handleSectionRef}
              handleAccordionChange={handleAccordionChange}
              handleHover={handleHover}
              hoveredSection={hoveredSection}
              isSectionExpanded={isSectionExpanded}
              getIconForGroup={getIconForGroup}
              mode={mode}
            />
          ))}
        </div>
      </form>
    </FormProvider>
  );
}
