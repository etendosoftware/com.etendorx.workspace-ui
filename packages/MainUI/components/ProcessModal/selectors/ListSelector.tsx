import { useTranslation } from '@/hooks/useTranslation';
import ChevronDown from '@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg';
import ChevronUp from '@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg';
import type { ListOption, ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

const SelectOption = ({ option, onClick }: { option: ListOption; onClick: (value: string) => void }) => {
  const handleClick = useCallback(() => {
    onClick(option.value);
  }, [onClick, option]);

  return (
    <div
      onClick={handleClick}
      className='px-3 py-2 hover:bg-baseline-10 cursor-pointer'
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}>
      {option.label}
    </div>
  );
};

const ListSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { setValue } = useFormContext();
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  const handleSelect = useCallback(
    (value: string) => {
      setSelected(value);
      setValue(parameter.dBColumnName, value);
      setOpen(false);
    },
    [parameter.dBColumnName, setValue],
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  const selectedLabel = useMemo(
    () => parameter.refList.find((opt) => opt.value === selected)?.label ?? t('form.select.placeholder'),
    [parameter.refList, selected, t],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        onClick={toggleOpen}
        className='w-full flex items-center justify-between px-3 py-2 h-10 border border-baseline-10 hover:border-baseline-100 rounded bg-white text-baseline-90 cursor-pointer transition-colors'>
        <span>{selectedLabel}</span>
        {open ? <ChevronUp fill='currentColor' /> : <ChevronDown fill='currentColor' />}
      </button>

      <div
        className={`absolute z-10 mt-1 w-full bg-white border border-baseline-20 rounded shadow-lg max-h-60 overflow-y-auto origin-top transition-all duration-200 ${open ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-0 pointer-events-none'}`}
        style={{ transformOrigin: 'top' }}>
        {parameter.refList.map((option) => (
          <SelectOption option={option} onClick={handleSelect} key={option.id} />
        ))}
      </div>
    </div>
  );
};

export default ListSelector;
