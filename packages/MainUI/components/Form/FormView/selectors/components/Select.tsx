import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

export interface Option {
  id: string;
  label: string;
}

export interface SelectProps {
  name: string;
  options: Option[];
  onFocus?: () => unknown;
  isReadOnly?: boolean;
}

export default function Select({ name, options, onFocus, isReadOnly }: SelectProps) {
  const { register, setValue, watch } = useFormContext();
  const selectedValue = watch(name);

  const [selectedLabel, setSelectedLabel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const selectedOption = options.find(option => option.id === selectedValue);
    setSelectedLabel(selectedOption?.label ?? '');
  }, [selectedValue, options]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      onFocus?.();
    }
  }, [isOpen, onFocus]);

  return (
    <div
      className={`relative w-full ${isReadOnly ? 'cursor-not-allowed user-select-none pointer-events-none' : ''}`}
      style={{
        cursor: 'not-allowed !important',
      }}
      onBlur={isReadOnly ? undefined : handleBlur}
      tabIndex={-1}>
      <input {...register(name)} type="hidden" readOnly={isReadOnly} /> {/* Manejo de react-hook-form */}
      {/* Input principal que muestra el valor seleccionado */}
      <div
        onClick={isReadOnly ? undefined : handleClick}
        className={`w-full h-12 rounded-2xl border border-gray-300 p-3 text-sm shadow-sm flex items-center justify-between focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300 ${isReadOnly ? 'bg-gray-200' : 'bg-white'}`}
        tabIndex={0}>
        <span className={selectedLabel ? 'text-black' : 'text-gray-400'}>{selectedLabel || 'Select an option'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {!isReadOnly && isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-2xl shadow-lg">
          {/* Input para filtrar las opciones */}
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full h-10 px-3 py-2 border-b border-gray-200 text-sm focus:outline-none"
            aria-label="Search options"
          />

          {/* Lista de opciones */}
          <ul ref={listRef} role="listbox" className="max-h-48 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(({ id, label }, index) => (
                <li
                  key={id}
                  role="option"
                  aria-selected={selectedValue === id}
                  onClick={() => handleSelect(id, label)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`p-2 ${highlightedIndex === index ? 'bg-blue-100' : ''}`}>
                  {label}
                </li>
              ))
            ) : (
              <li className="p-2 text-gray-500">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export { Select };
