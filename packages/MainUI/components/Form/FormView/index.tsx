import { EntityData, FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { FormProvider, useForm } from 'react-hook-form';
import { BaseSelector } from './selectors/BaseSelector';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormAction } from '@/hooks/useFormAction';
import Collapsible from '../Collapsible';
import StatusBar from './StatusBar';
import useFormFields from '@/hooks/useFormFields';
import PrimaryTabs from '@workspaceui/componentlibrary/src/components/PrimaryTab';
import { TabItem } from '@workspaceui/componentlibrary/src/components/PrimaryTab/types';
import Info from '@workspaceui/componentlibrary/src/assets/icons/info.svg';
import InfoIcon from '@workspaceui/componentlibrary/src/assets/icons/file-text.svg';
import FileIcon from '@workspaceui/componentlibrary/src/assets/icons/file.svg';
import FolderIcon from '@workspaceui/componentlibrary/src/assets/icons/folder.svg';
import { useTheme } from '@mui/material';
import { FormViewProps } from './types';
import { useStatusModal } from '@/hooks/Toolbar/useStatusModal';
import StatusModal from '@workspaceui/componentlibrary/src/components/StatusModal';
import { useFormInitialization } from '@/hooks/useFormInitialization';
import { useFormInitialState } from '@/hooks/useFormInitialState';
import { useToolbarContext } from '@/contexts/ToolbarContext';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useRouter } from 'next/navigation';

const iconMap: Record<string, React.ReactElement> = {
  'Main Section': <FileIcon />,
  'More Information': <InfoIcon />,
  Dimensions: <FolderIcon />,
};

export function FormView({ window: windowMetadata, tab, mode, recordId }: FormViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<string[]>(['null']);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const { statusModal, showSuccessModal, showErrorModal, hideStatusModal } = useStatusModal();

  const { fields, groups } = useFormFields(tab);
  const {
    formInitialization,
    refetch,
    loading: loadingFormInitialization,
  } = useFormInitialization({
    tab,
    mode: mode,
    recordId,
  });
  const { registerActions } = useToolbarContext();

  const initialState = useFormInitialState(formInitialization) || undefined;

  const { reset, setValue, ...form } = useForm({ values: initialState as EntityData });

  const handleBack = useCallback(() => {
    const params = new URLSearchParams(location.search);
    params.delete('recordId_' + tab.id);
    router.replace(`${location.pathname}?${params}`);
  }, [router, tab.id]);

  const defaultIcon = useMemo(
    () => <Info fill={theme.palette.baselineColor.neutral[80]} />,
    [theme.palette.baselineColor.neutral],
  );

  const getIconForGroup = useCallback(
    (identifier: string) => {
      return iconMap[identifier] || defaultIcon;
    },
    [defaultIcon],
  );

  const tabs: TabItem[] = useMemo(() => {
    return groups.map(([id, group]) => ({
      id: String(id || '_main'),
      icon: getIconForGroup(group.identifier),
      label: group.identifier,
      fill: theme.palette.baselineColor.neutral[80],
      hoverFill: theme.palette.baselineColor.neutral[0],
      showInTab: true,
    }));
  }, [groups, getIconForGroup, theme.palette.baselineColor.neutral]);

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

  const onReset = useCallback(async () => {
    refetch();
  }, [refetch]);

  const onSuccess = useCallback(
    async (data: EntityData) => {
      if (mode === FormMode.EDIT) {
        reset({ ...initialState, ...data });
      } else {
        const params = new URLSearchParams(location.search);
        params.set('recordId_' + tab.id, String(data.id));
        history.pushState(null, '', `?${params.toString()}`);
        refetch();
      }
      showSuccessModal('Saved');
    },
    [initialState, mode, refetch, reset, showSuccessModal, tab.id],
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

  const isSectionExpanded = useCallback(
    (sectionId: string | null) => {
      const id = String(sectionId);
      return expandedSections.includes(id);
    },
    [expandedSections],
  );

  useEffect(() => {
    if (!initialState) return;

    Object.entries(initialState).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        initialState[key] = '';
      }
    });

    reset({ ...initialState });
  }, [initialState, reset]);

  useEffect(() => {
    registerActions({ save: save, refresh: onReset, new: onReset, back: handleBack });
  }, [handleBack, onReset, registerActions, save]);

  if (loading || loadingFormInitialization) {
    return <Spinner />;
  }

  return (
    <FormProvider setValue={setValue} reset={reset} {...form}>
      <form
        className={`w-full h-full flex flex-col transition duration-300  ${
          loading ? 'opacity-50 select-none cursor-progress cursor-to-children' : ''
        }`}
        onSubmit={save}>
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
            <PrimaryTabs tabs={tabs} onChange={handleTabChange} selectedTab={selectedTab} icon={defaultIcon} />
          </div>
        </div>

        <div className="flex-grow overflow-auto p-2 space-y-2" ref={containerRef}>
          {groups.map(([id, group]) => {
            const sectionId = String(id || '_main');
            return (
              <div key={sectionId} ref={handleSectionRef(id)}>
                <Collapsible
                  title={group.identifier}
                  isExpanded={isSectionExpanded(id)}
                  sectionId={sectionId}
                  icon={getIconForGroup(group.identifier)}
                  onToggle={(isOpen: boolean) => handleAccordionChange(id, isOpen)}>
                  <div className="grid grid-cols-3 auto-rows-auto gap-4">
                    {Object.entries(group.fields).map(([hqlName, field]) => (
                      <BaseSelector field={field} key={hqlName} formMode={mode} />
                    ))}
                  </div>
                </Collapsible>
              </div>
            );
          })}
        </div>
      </form>
    </FormProvider>
  );
}

export default FormView;
