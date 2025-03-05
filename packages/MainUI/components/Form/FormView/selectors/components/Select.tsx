import { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';

export interface Option {
  id: string;
  label: string;
}

export interface SelectProps {
  name: string;
  options: Option[];
}

export default function Select({ name, options }: SelectProps) {
  const { register, setValue, watch } = useFormContext();
  const selectedValue = watch(name); // Valor seleccionado en el formulario

  const [selectedLabel, setSelectedLabel] = useState(''); // Muestra el valor seleccionado
  const [searchTerm, setSearchTerm] = useState('');       // Filtra opciones
  const [isOpen, setIsOpen] = useState(false);            // Controla el desplegable
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1); // Opción enfocada

  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selectedOption = options.find((option) => option.id === selectedValue);
    setSelectedLabel(selectedOption?.label ?? '');
  }, [selectedValue, options]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');  // Limpia búsqueda al abrir
      setHighlightedIndex(0); 
      setTimeout(() => searchInputRef.current?.focus(), 0); // Auto-focus al input de búsqueda
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string, label: string) => {
    setValue(name, id);         // Actualiza react-hook-form
    setSelectedLabel(label);    // Actualiza label mostrado
    setIsOpen(false);           // Cierra menú
    setHighlightedIndex(-1);    // Reinicia foco
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? filteredOptions.length - 1 : prev - 1
      );
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

  return (
    <div className="relative w-full" onBlur={handleBlur} tabIndex={-1}>
      <input {...register(name)} type="hidden" /> {/* Manejo de react-hook-form */}

      {/* Input principal que muestra el valor seleccionado */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-12 bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm cursor-pointer flex items-center justify-between focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-300"
        tabIndex={0}
      >
        <span className={selectedLabel ? 'text-black' : 'text-gray-400'}>
          {selectedLabel || 'Select an option'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-2xl shadow-lg">
          {/* Input para filtrar las opciones */}
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full h-10 px-3 py-2 border-b border-gray-200 text-sm focus:outline-none"
            aria-label="Search options"
          />

          {/* Lista de opciones */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-48 overflow-auto"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map(({ id, label }, index) => (
                <li
                  key={id}
                  role="option"
                  aria-selected={selectedValue === id}
                  onClick={() => handleSelect(id, label)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`p-2 cursor-pointer ${
                    highlightedIndex === index ? 'bg-blue-100' : ''
                  }`}
                >
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