import useDebounce from '@/hooks/useDebounce';
import Image from 'next/image';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import checkIconUrl from '../../../../../../ComponentLibrary/src/assets/icons/check-circle-filled.svg?url';
import ChevronDown from '../../../../../../ComponentLibrary/src/assets/icons/chevron-down.svg';
import closeIconUrl from '../../../../../../ComponentLibrary/src/assets/icons/x.svg?url';
import type { SelectProps } from './types';

const OptionItem = memo(
  ({
    id,
    label,
    index,
    isSelected,
    isHighlighted,
    onOptionClick,
    onMouseEnter,
  }: {
    id: string;
    label: string;
    index: number;
    isSelected: boolean;
    isHighlighted: boolean;
    onOptionClick: (id: string, label: string) => void;
    onMouseEnter: (index: number) => void;
  }) => (
    <li
      aria-selected={isSelected}
      onClick={() => onOptionClick(id, label)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOptionClick(id, label);
        }
      }}
      onMouseEnter={() => onMouseEnter(index)}
      className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:bg-baseline-10
      ${isHighlighted ? 'bg-baseline-10' : ''}
      ${isSelected ? 'bg-baseline-10 font-medium' : ''}
      hover:bg-baseline-10`}>
      <span className={`truncate mr-2 ${isSelected ? 'text-dynamic-dark' : 'text-baseline-90'}`}>{label}</span>
      {isSelected && (
        <Image src={checkIconUrl} alt='Selected Item' className='fade-in-left flex-shrink-0' height={16} width={16} />
      )}
    </li>
  ),
);

OptionItem.displayName = 'OptionItem';

function SelectCmp({
  name,
  options,
  onFocus,
  isReadOnly,
  onSearch,
  onLoadMore,
  loading = false,
  hasMore = true,
  field,
}: SelectProps) {
  const { register, setValue, watch } = useFormContext();
  const selectedValue = watch(name);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isHovering, setIsHovering] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLLIElement>(null);
  const debouncedSetSearchTerm = useDebounce(onSearch);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm],
  );

  // Callbacks estables que no cambian en cada render
  const handleSelect = useCallback(
    (id: string, label: string) => {
      const option = options.find((opt) => opt.id === id);
      setValue(`${name}_data`, option?.data);
      setValue(name, id);
      setSelectedLabel(label);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [name, options, setValue],
  );

  const handleOptionClick = useCallback(
    (id: string, label: string) => {
      handleSelect(id, label);
    },
    [handleSelect],
  );

  const handleOptionMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
      }

      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option) handleSelect(option.id, option.label);
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    },
    [filteredOptions, highlightedIndex, handleSelect],
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isReadOnly) {
      setIsOpen((prev) => !prev);
    }
  }, [isReadOnly]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValue(name, '');
      setSelectedLabel('');
    },
    [name, setValue],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  const handleScroll = useCallback(() => {
    if (!listRef.current || loading || !hasMore) return;

    const list = listRef.current;
    const scrollBottom = list.scrollTop + list.clientHeight;

    if (scrollBottom >= list.scrollHeight * 0.9) {
      onLoadMore?.();
    }
  }, [loading, hasMore, onLoadMore]);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleSetSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);

      if (debouncedSetSearchTerm) {
        debouncedSetSearchTerm(term);
      }
    },
    [debouncedSetSearchTerm],
  );

  useEffect(() => {
    const selectedOption = options.find((option) => option.id === selectedValue);
    if (!selectedOption && selectedValue) {
      setSelectedLabel(selectedValue);
    } else {
      setSelectedLabel(selectedOption?.label ?? '');
    }
  }, [selectedValue, options]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 1);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Renderizado optimizado de opciones
  const renderedOptions = useMemo(() => {
    if (filteredOptions.length > 0) {
      return filteredOptions.map(({ id, label }, index) => (
        <OptionItem
          key={id}
          id={id}
          label={label}
          index={index}
          isSelected={selectedValue === id}
          isHighlighted={highlightedIndex === index}
          onOptionClick={handleOptionClick}
          onMouseEnter={handleOptionMouseEnter}
        />
      ));
    }
    return <li className='px-4 py-3 text-sm text-baseline-60'>No options found</li>;
  }, [filteredOptions, highlightedIndex, selectedValue, handleOptionClick, handleOptionMouseEnter]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full font-['Inter'] ${isReadOnly ? 'pointer-events-none' : ''}`}
      onBlur={isReadOnly ? undefined : handleBlur}
      aria-label={field.name}
      aria-readonly={isReadOnly}
      aria-required={field.isMandatory}
      aria-disabled={isReadOnly}
      aria-details={field.helpComment}
      tabIndex={-1}>
      <input {...register(name)} type='hidden' readOnly={isReadOnly} />
      <div
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`w-full flex items-center justify-between px-3 py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light
          ${isOpen ? 'rounded border-b-0 border-dynamic-main ring-2 ring-dynamic-light' : 'border-baseline-40'} 
          ${isReadOnly ? 'bg-transparent-neutral-20 rounded-t-lg cursor-not-allowed' : 'bg-white text-baseline-90 cursor-pointer hover:border-baseline-60'}
          transition-colors outline-none`}>
        <span
          className={`text-sm truncate max-w-[calc(100%-40px)] ${selectedLabel ? 'text-baseline-90 font-medium' : 'text-baseline-60'}`}>
          {selectedLabel || 'Select an option'}
        </span>
        <div className='flex items-center flex-shrink-0 ml-2'>
          {selectedLabel && (isHovering || isOpen) && (
            <button
              type='button'
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear;
                }
              }}
              className='mr-1 text-baseline-60 hover:text-baseline-80 transition-opacity opacity-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light rounded'
              aria-label='Clear selection'>
              <Image src={closeIconUrl} alt='Clear' height={16} width={16} />
            </button>
          )}
          <ChevronDown
            fill='currentColor'
            className={`w-5 h-5 text-baseline-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {!isReadOnly && isOpen && (
        <div className='absolute z-10 mt-1 w-full bg-white rounded shadow-lg overflow-hidden'>
          <div className='p-2'>
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={handleSetSearchTerm}
              onKeyDown={handleKeyDown}
              placeholder='Search...'
              className='w-full p-2 text-sm border border-baseline-30 rounded focus:outline-none focus:border-dynamic-main focus:ring-1 focus:ring-dynamic-light'
              aria-label='Search options'
              onFocus={handleFocus}
            />
          </div>
          <ul ref={listRef} className='max-h-60 overflow-y-auto focus:outline-none' onScroll={handleScroll}>
            {renderedOptions}
            {loading && hasMore && (
              <li ref={loadingRef} className='px-4 py-3 text-sm text-baseline-60 text-center'>
                Loading more options...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const Select = memo(SelectCmp);
export default Select;
export { Select };
