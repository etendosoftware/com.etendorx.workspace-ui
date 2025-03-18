import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { SelectProps } from './types';
import checkIconUrl from '../../../../../../ComponentLibrary/src/assets/icons/check-circle-filled.svg?url';
import closeIconUrl from '../../../../../../ComponentLibrary/src/assets/icons/x.svg?url';
import ChevronDown from '../../../../../../ComponentLibrary/src/assets/icons/chevron-down.svg';
import Image from 'next/image';

export default function Select({
  name,
  options,
  onFocus,
  isReadOnly,
  onLoadMore,
  loading = false,
  hasMore = true,
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
  const hasLoadedRef = useRef<boolean>(false);

  const filteredOptions = useMemo(
    () => options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm],
  );

  const handleSelect = useCallback(
    (id: string, label: string) => {
      setValue(name, id);
      setSelectedLabel(label);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [name, setValue],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
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
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isReadOnly) {
      setIsOpen(prev => !prev);
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

  useEffect(() => {
    const selectedOption = options.find(option => option.id === selectedValue);
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

      if (!hasLoadedRef.current) {
        onFocus?.(selectedValue);
        hasLoadedRef.current = true;
      }
    }
  }, [isOpen, onFocus, selectedValue]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full font-['Inter'] ${isReadOnly ? 'pointer-events-none' : ''}`}
      onBlur={isReadOnly ? undefined : handleBlur}
      tabIndex={-1}>
      <input {...register(name)} type="hidden" readOnly={isReadOnly} />
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`w-full flex items-center justify-between px-3 py-2 h-10 border-b border-baseline-10 hover:border-baseline-100
          ${isOpen ? 'rounded border-b-0 border-dynamic-main ring-2 ring-dynamic-light' : 'border-baseline-40'} 
          ${isReadOnly ? 'bg-transparent-neutral-20 rounded-t-lg cursor-not-allowed' : 'bg-white text-baseline-90 cursor-pointer hover:border-baseline-60'}
          transition-colors outline-none`}
        tabIndex={0}>
        <span
          className={`text-sm truncate max-w-[calc(100%-40px)] ${selectedLabel ? 'text-baseline-90 font-medium' : 'text-baseline-60'}`}>
          {selectedLabel || 'Select an option'}
        </span>
        <div className="flex items-center flex-shrink-0 ml-2">
          {selectedLabel && (isHovering || isOpen) && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-1 text-baseline-60 hover:text-baseline-80 transition-opacity opacity-100"
              aria-label="Clear selection">
              <Image src={closeIconUrl} alt="Clear" height={16} width={16} />
            </button>
          )}
          <ChevronDown
            fill="currentColor"
            className={`w-5 h-5 text-baseline-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {!isReadOnly && isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded shadow-lg overflow-hidden">
          <div className="p-2">
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full p-2 text-sm border border-baseline-30 rounded focus:outline-none focus:border-dynamic-main focus:ring-1 focus:ring-dynamic-light"
              aria-label="Search options"
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto" onScroll={handleScroll}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(({ id, label }, index) => (
                <li
                  key={id}
                  role="option"
                  aria-selected={selectedValue === id}
                  onClick={() => handleSelect(id, label)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between
                    ${highlightedIndex === index ? 'bg-baseline-10' : ''}
                    ${selectedValue === id ? 'bg-baseline-10 font-medium' : ''}
                    hover:bg-baseline-10`}>
                  <span className={`truncate mr-2 ${selectedValue === id ? 'text-dynamic-dark' : 'text-baseline-90'}`}>
                    {label}
                  </span>
                  {selectedValue === id && (
                    <Image
                      src={checkIconUrl}
                      alt="Selected Item"
                      className="fade-in-left flex-shrink-0"
                      height={16}
                      width={16}
                    />
                  )}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-baseline-60">No options found</li>
            )}

            {loading && hasMore && (
              <li ref={loadingRef} className="px-4 py-3 text-sm text-baseline-60 text-center">
                Loading more options...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export { Select };
