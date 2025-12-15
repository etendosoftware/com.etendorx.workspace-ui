import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ============================================
// HOOKS
// ============================================

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

const useEscapeKey = (handler) => {
  useEffect(() => {
    const listener = (e) => e.key === "Escape" && handler();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [handler]);
};

const useWindowResize = (handler) => {
  useEffect(() => {
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [handler]);
};

// ============================================
// ICONS
// ============================================

const FilterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

// ============================================
// MENU COMPONENT
// ============================================

const Menu = ({ anchorEl, onClose, children, className = "", offsetX = 0, offsetY = 0 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!anchorEl || !menuRef.current) return;
    const anchorRect = anchorEl.getBoundingClientRect();
    const menuElement = menuRef.current;
    menuElement.style.maxHeight = "";
    menuElement.style.overflowY = "";

    let x = anchorRect.left + offsetX;
    if (x + menuElement.offsetWidth > window.innerWidth) {
      x = anchorRect.right - menuElement.offsetWidth - offsetX;
      if (x < 0) x = 8;
    }
    x = Math.max(8, Math.min(x, window.innerWidth - menuElement.offsetWidth - 8));

    const spaceBelow = window.innerHeight - anchorRect.bottom;
    let y = anchorRect.bottom + offsetY;

    if (menuElement.offsetHeight > spaceBelow) {
      const spaceAbove = anchorRect.top;
      if (spaceAbove > spaceBelow && menuElement.offsetHeight <= spaceAbove) {
        y = anchorRect.top - menuElement.offsetHeight - offsetY;
      } else {
        const maxH = Math.max(spaceBelow, spaceAbove) - 16;
        menuElement.style.maxHeight = `${maxH}px`;
        menuElement.style.overflowY = "auto";
      }
    }

    y = Math.max(8, Math.min(y, window.innerHeight - Math.min(menuElement.offsetHeight, window.innerHeight - 16) - 8));
    setPosition({ x, y });
  }, [anchorEl, offsetX, offsetY]);

  useEffect(() => {
    if (!anchorEl) { setVisible(false); return; }
    const timer = setTimeout(() => { calculatePosition(); setVisible(true); }, 0);
    return () => clearTimeout(timer);
  }, [anchorEl, calculatePosition]);

  const handleClose = () => {
    setVisible(false);
    timeoutRef.current = setTimeout(() => onClose(), 150);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  useClickOutside(menuRef, handleClose);
  useEscapeKey(handleClose);
  useWindowResize(calculatePosition);

  if (!anchorEl) return null;

  return createPortal(
    <div
      role="menu"
      ref={menuRef}
      className={`fixed z-[9999] bg-white transition-opacity duration-150 rounded-lg border border-gray-200 ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{
        top: position.y,
        left: position.x,
        visibility: visible ? "visible" : "hidden",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
        minWidth: anchorEl.offsetWidth,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

// ============================================
// SELECT COMPONENT
// ============================================

const Select = ({ options, value, onChange, placeholder = "Seleccionar...", disabled = false, searchable = true, size = "normal" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const filteredOptions = useMemo(() => options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())), [options, searchTerm]);

  const handleSelect = (optionId) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); setHighlightedIndex((p) => (p < filteredOptions.length - 1 ? p + 1 : 0)); break;
      case "ArrowUp": e.preventDefault(); setHighlightedIndex((p) => (p > 0 ? p - 1 : filteredOptions.length - 1)); break;
      case "Enter": e.preventDefault(); if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) handleSelect(filteredOptions[highlightedIndex].id); break;
      case "Escape": setIsOpen(false); setSearchTerm(""); break;
    }
  };

  useEffect(() => { if (isOpen && searchInputRef.current && searchable) searchInputRef.current.focus(); }, [isOpen, searchable]);

  const sizeClasses = size === "small" ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm";

  // Check if selected option has a color (for tags)
  const showAsTag = selectedOption?.color && value;

  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-500 text-white",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-700",
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) { e.preventDefault(); setIsOpen(!isOpen); } }}
        tabIndex={disabled ? -1 : 0}
        className={`relative flex items-center justify-between rounded-t border-0 border-b-2 transition-all cursor-pointer select-none ${sizeClasses} ${
          disabled ? "bg-gray-50 border-gray-200 border-dotted cursor-not-allowed opacity-60"
            : isOpen ? "bg-blue-50 border-blue-600 text-blue-600"
            : "bg-gray-50 border-gray-300 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        {showAsTag ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[selectedOption.color] || colorClasses.gray}`}>
            {selectedOption.label}
          </span>
        ) : (
          <span className={`truncate pr-2 ${size === "small" ? "text-xs" : "text-sm"} ${selectedOption ? (isOpen ? "text-blue-600 font-medium" : "text-gray-800 font-medium") : "text-gray-400"}`}>
            {selectedOption?.label || placeholder}
          </span>
        )}
        <ChevronDownIcon className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-600" : "text-gray-400"}`} />
      </div>

      <Menu anchorEl={isOpen ? triggerRef.current : null} onClose={() => { setIsOpen(false); setSearchTerm(""); }} offsetY={4} className="py-1">
        {searchable && (
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
          </div>
        )}
        <ul ref={listRef} className="max-h-48 overflow-y-auto">
          {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
            <li
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between ${highlightedIndex === idx ? "bg-gray-50" : ""} ${value === opt.id ? "bg-gray-50 font-medium" : ""} hover:bg-gray-50`}
            >
              {opt.color ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[opt.color] || colorClasses.gray}`}>
                  {opt.label}
                </span>
              ) : (
                <span className={value === opt.id ? "text-gray-900" : "text-gray-700"}>{opt.label}</span>
              )}
              {value === opt.id && <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />}
            </li>
          )) : <li className="px-4 py-3 text-sm text-gray-400">No se encontraron opciones</li>}
        </ul>
      </Menu>
    </>
  );
};

// ============================================
// OPERATORS
// ============================================

const getOperatorsForType = (type) => {
  const base = [{ id: "equals", label: "= Igual a" }, { id: "not_equals", label: "≠ No es igual a" }];
  switch (type) {
    case "string": return [...base, { id: "contains", label: "Contiene" }, { id: "not_contains", label: "No contiene" }, { id: "starts_with", label: "Empieza con" }, { id: "ends_with", label: "Termina con" }, { id: "is_empty", label: "Está vacío" }, { id: "is_not_empty", label: "No está vacío" }];
    case "number": return [...base, { id: "greater_than", label: "> Mayor que" }, { id: "less_than", label: "< Menor que" }, { id: "greater_or_equal", label: "≥ Mayor o igual" }, { id: "less_or_equal", label: "≤ Menor o igual" }];
    case "date": return [...base, { id: "before", label: "Antes de" }, { id: "after", label: "Después de" }, { id: "today", label: "Hoy" }, { id: "this_week", label: "Esta semana" }, { id: "this_month", label: "Este mes" }];
    case "boolean": return [{ id: "is_true", label: "Es verdadero" }, { id: "is_false", label: "Es falso" }];
    case "select": return [{ id: "equals", label: "= Igual a" }, { id: "not_equals", label: "≠ No es igual a" }];
    default: return base;
  }
};

// ============================================
// FILTER CONDITION ROW (inside a group)
// ============================================

const FilterConditionRow = memo(({ condition, columns, isFirst, onUpdate, onDelete, size = "small" }) => {
  const selectedColumn = columns.find((c) => c.id === condition.column);
  const operators = selectedColumn ? getOperatorsForType(selectedColumn.type) : [];
  const columnOptions = columns.map((c) => ({ id: c.id, label: c.label }));
  const logicalOptions = [{ id: "AND", label: "Y" }, { id: "OR", label: "O" }];
  const valueOptions = selectedColumn?.options || [];
  const showValueSelect = selectedColumn?.type === "select" && valueOptions.length > 0;
  const hideValueInput = ["is_empty", "is_not_empty", "is_true", "is_false", "today", "this_week", "this_month"].includes(condition.operator);

  const inputSizeClasses = size === "small" ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm";

  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* Logical Operator / "Donde" */}
      <div className="w-14 flex-shrink-0">
        {isFirst ? (
          <span className="text-xs text-gray-500 font-medium">Donde</span>
        ) : (
          <Select
            options={logicalOptions}
            value={condition.logicalOperator}
            onChange={(v) => onUpdate(condition.id, { logicalOperator: v })}
            searchable={false}
            size="small"
          />
        )}
      </div>

      {/* Column */}
      <div className="flex-1 min-w-[90px]">
        <Select
          options={columnOptions}
          value={condition.column}
          onChange={(v) => onUpdate(condition.id, { column: v, operator: "", value: "" })}
          placeholder="Columna..."
          size={size}
        />
      </div>

      {/* Operator */}
      <div className="flex-1 min-w-[90px]">
        <Select
          options={operators}
          value={condition.operator}
          onChange={(v) => onUpdate(condition.id, { operator: v })}
          placeholder="Condición"
          disabled={!condition.column}
          size={size}
        />
      </div>

      {/* Value */}
      <div className="flex-1 min-w-[90px]">
        {hideValueInput ? (
          <div className={`bg-gray-100 rounded-t border-b-2 border-gray-200 border-dotted ${size === "small" ? "h-8" : "h-10"}`} />
        ) : showValueSelect ? (
          <Select
            options={valueOptions}
            value={condition.value}
            onChange={(v) => onUpdate(condition.id, { value: v })}
            placeholder="Valor"
            disabled={!condition.operator}
            size={size}
          />
        ) : (
          <input
            type={selectedColumn?.type === "number" ? "number" : selectedColumn?.type === "date" ? "date" : "text"}
            value={condition.value}
            onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
            disabled={!condition.operator}
            placeholder="Valor"
            className={`w-full rounded-t border-0 border-b-2 transition-all ${inputSizeClasses} ${
              !condition.operator
                ? "bg-gray-50 border-gray-200 border-dotted cursor-not-allowed"
                : "bg-gray-50 border-gray-300 hover:border-gray-400 focus:bg-blue-50 focus:border-blue-600 focus:outline-none"
            }`}
          />
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(condition.id)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
        aria-label="Eliminar"
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

// ============================================
// SIMPLE FILTER ROW (top level condition)
// ============================================

const FilterRow = memo(({ condition, columns, isFirst, onUpdate, onDelete }) => {
  const selectedColumn = columns.find((c) => c.id === condition.column);
  const operators = selectedColumn ? getOperatorsForType(selectedColumn.type) : [];
  const columnOptions = columns.map((c) => ({ id: c.id, label: c.label }));
  const logicalOptions = [{ id: "AND", label: "Y" }, { id: "OR", label: "O" }];
  const valueOptions = selectedColumn?.options || [];
  const showValueSelect = selectedColumn?.type === "select" && valueOptions.length > 0;
  const hideValueInput = ["is_empty", "is_not_empty", "is_true", "is_false", "today", "this_week", "this_month"].includes(condition.operator);

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Logical Operator / "Donde" */}
      <div className="w-16 flex-shrink-0">
        {isFirst ? (
          <span className="text-sm text-gray-600 font-medium">Donde</span>
        ) : (
          <Select
            options={logicalOptions}
            value={condition.logicalOperator}
            onChange={(v) => onUpdate(condition.id, { logicalOperator: v })}
            searchable={false}
          />
        )}
      </div>

      {/* Column */}
      <div className="flex-1 min-w-[120px]">
        <Select
          options={columnOptions}
          value={condition.column}
          onChange={(v) => onUpdate(condition.id, { column: v, operator: "", value: "" })}
          placeholder="Columna"
        />
      </div>

      {/* Operator */}
      <div className="flex-1 min-w-[120px]">
        <Select
          options={operators}
          value={condition.operator}
          onChange={(v) => onUpdate(condition.id, { operator: v })}
          placeholder="Condición"
          disabled={!condition.column}
        />
      </div>

      {/* Value */}
      <div className="flex-1 min-w-[120px]">
        {hideValueInput ? (
          <div className="h-10 bg-gray-100 rounded-t border-b-2 border-gray-200 border-dotted" />
        ) : showValueSelect ? (
          <Select
            options={valueOptions}
            value={condition.value}
            onChange={(v) => onUpdate(condition.id, { value: v })}
            placeholder="Valor"
            disabled={!condition.operator}
          />
        ) : (
          <input
            type={selectedColumn?.type === "number" ? "number" : selectedColumn?.type === "date" ? "date" : "text"}
            value={condition.value}
            onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
            disabled={!condition.operator}
            placeholder="Valor"
            className={`w-full h-10 px-3 text-sm rounded-t border-0 border-b-2 transition-all ${
              !condition.operator
                ? "bg-gray-50 border-gray-200 border-dotted cursor-not-allowed"
                : "bg-gray-50 border-gray-300 hover:border-gray-400 focus:bg-blue-50 focus:border-blue-600 focus:outline-none"
            }`}
          />
        )}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(condition.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
        aria-label="Eliminar"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
});

// ============================================
// FILTER GROUP (as a row with nested conditions)
// ============================================

const FilterGroup = ({ group, isFirst, columns, onUpdate, onDelete, onUpdateCondition, onDeleteCondition, onAddCondition }) => {
  const logicalOptions = [{ id: "AND", label: "Y" }, { id: "OR", label: "O" }];

  return (
    <div className="flex gap-3 py-2">
      {/* Logical Operator for the group row */}
      <div className="w-16 flex-shrink-0 pt-2">
        {isFirst ? (
          <span className="text-sm text-gray-600 font-medium">Donde</span>
        ) : (
          <Select
            options={logicalOptions}
            value={group.logicalOperator}
            onChange={(v) => onUpdate(group.id, { logicalOperator: v })}
            searchable={false}
          />
        )}
      </div>

      {/* Group box */}
      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
        {/* Headers inside group */}
        <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-200">
          <div className="w-14 flex-shrink-0" />
          <div className="flex-1 min-w-[90px]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Columna</span>
          </div>
          <div className="flex-1 min-w-[90px]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Condición</span>
          </div>
          <div className="flex-1 min-w-[90px]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valor</span>
          </div>
          <div className="w-8 flex-shrink-0" />
        </div>

        {/* Conditions inside group */}
        {group.conditions.map((cond, idx) => (
          <FilterConditionRow
            key={cond.id}
            condition={cond}
            columns={columns}
            isFirst={idx === 0}
            onUpdate={(condId, updates) => onUpdateCondition(group.id, condId, updates)}
            onDelete={(condId) => onDeleteCondition(group.id, condId)}
            size="small"
          />
        ))}

        {/* Add condition inside group */}
        <button
          type="button"
          onClick={() => onAddCondition(group.id)}
          className="flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Añadir condición <PlusIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Delete group */}
      <button
        type="button"
        onClick={() => onDelete(group.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 self-start mt-1"
        aria-label="Eliminar grupo"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================
// TABLE FILTER MAIN COMPONENT
// ============================================

const TableFilter = ({ columns, onApplyFilters, onSaveFilter, onClear, savedFilters = [], onLoadSavedFilter, onAIFilter }) => {
  const [activeTab, setActiveTab] = useState("advanced");
  
  const genId = () => Math.random().toString(36).substr(2, 9);
  const createEmptyCondition = () => ({ id: genId(), column: "", operator: "", value: "", logicalOperator: "AND" });

  // Items can be either conditions or groups
  const [items, setItems] = useState([
    { type: "condition", ...createEmptyCondition() }
  ]);

  // Count valid filters
  const countValidFilters = () => {
    let count = 0;
    items.forEach(item => {
      if (item.type === "condition") {
        if (item.column && item.operator) count++;
      } else if (item.type === "group") {
        item.conditions.forEach(c => {
          if (c.column && c.operator) count++;
        });
      }
    });
    return count;
  };

  const validFilterCount = countValidFilters();

  // Add a simple condition
  const handleAddCondition = () => {
    setItems(prev => [...prev, { type: "condition", ...createEmptyCondition() }]);
  };

  // Add a group
  const handleAddGroup = () => {
    setItems(prev => [...prev, {
      type: "group",
      id: genId(),
      logicalOperator: "AND",
      conditions: [createEmptyCondition()]
    }]);
  };

  // Update a top-level condition
  const handleUpdateCondition = (id, updates) => {
    setItems(prev => prev.map(item => 
      item.type === "condition" && item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Delete a top-level condition
  const handleDeleteCondition = (id) => {
    setItems(prev => {
      const updated = prev.filter(item => !(item.type === "condition" && item.id === id));
      if (updated.length === 0) return [{ type: "condition", ...createEmptyCondition() }];
      return updated;
    });
  };

  // Update a group
  const handleUpdateGroup = (id, updates) => {
    setItems(prev => prev.map(item =>
      item.type === "group" && item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Delete a group
  const handleDeleteGroup = (id) => {
    setItems(prev => {
      const updated = prev.filter(item => !(item.type === "group" && item.id === id));
      if (updated.length === 0) return [{ type: "condition", ...createEmptyCondition() }];
      return updated;
    });
  };

  // Update condition inside a group
  const handleUpdateGroupCondition = (groupId, conditionId, updates) => {
    setItems(prev => prev.map(item => {
      if (item.type === "group" && item.id === groupId) {
        return {
          ...item,
          conditions: item.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c)
        };
      }
      return item;
    }));
  };

  // Delete condition inside a group
  const handleDeleteGroupCondition = (groupId, conditionId) => {
    setItems(prev => prev.map(item => {
      if (item.type === "group" && item.id === groupId) {
        const newConditions = item.conditions.filter(c => c.id !== conditionId);
        // If no conditions left, keep at least one empty
        if (newConditions.length === 0) {
          return { ...item, conditions: [createEmptyCondition()] };
        }
        return { ...item, conditions: newConditions };
      }
      return item;
    }));
  };

  // Add condition inside a group
  const handleAddGroupCondition = (groupId) => {
    setItems(prev => prev.map(item => {
      if (item.type === "group" && item.id === groupId) {
        return { ...item, conditions: [...item.conditions, createEmptyCondition()] };
      }
      return item;
    }));
  };

  // Clear all
  const handleClearAll = () => {
    setItems([{ type: "condition", ...createEmptyCondition() }]);
    onClear?.();
  };

  // Apply filters
  const handleApply = () => {
    const result = items
      .map(item => {
        if (item.type === "condition") {
          if (item.column && item.operator) {
            return { type: "condition", ...item };
          }
          return null;
        } else {
          const validConditions = item.conditions.filter(c => c.column && c.operator);
          if (validConditions.length > 0) {
            return { ...item, conditions: validConditions };
          }
          return null;
        }
      })
      .filter(Boolean);
    
    onApplyFilters(result);
  };

  // Save filter
  const handleSave = () => {
    const name = prompt("Nombre del filtro:");
    if (name && onSaveFilter) onSaveFilter(name, items);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "advanced" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FilterIcon className="w-4 h-4" />
            Filtros avanzados
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "saved" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Filtros guardados
          </button>
        </div>
        {onAIFilter && (
          <button
            type="button"
            onClick={onAIFilter}
            disabled
            className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-blue-600 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Filtrar con IA
            <SparklesIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "advanced" ? (
        <div className="p-4">
          {/* Headers */}
          <div className="flex items-center gap-3 pb-2 border-b border-gray-100 mb-2">
            <div className="w-16 flex-shrink-0" />
            <div className="flex-1 min-w-[120px]">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Columna</span>
            </div>
            <div className="flex-1 min-w-[120px]">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Condición</span>
            </div>
            <div className="flex-1 min-w-[120px]">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</span>
            </div>
            <div className="w-10 flex-shrink-0" />
          </div>

          {/* Filter Items (conditions and groups) */}
          <div className="space-y-1">
            {items.map((item, index) => {
              if (item.type === "condition") {
                return (
                  <FilterRow
                    key={item.id}
                    condition={item}
                    columns={columns}
                    isFirst={index === 0}
                    onUpdate={handleUpdateCondition}
                    onDelete={handleDeleteCondition}
                  />
                );
              } else {
                return (
                  <FilterGroup
                    key={item.id}
                    group={item}
                    isFirst={index === 0}
                    columns={columns}
                    onUpdate={handleUpdateGroup}
                    onDelete={handleDeleteGroup}
                    onUpdateCondition={handleUpdateGroupCondition}
                    onDeleteCondition={handleDeleteGroupCondition}
                    onAddCondition={handleAddGroupCondition}
                  />
                );
              }
            })}
          </div>

          {/* Add buttons */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleAddCondition}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Añadir condición <PlusIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddGroup}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Añadir grupo <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {savedFilters.length > 0 ? (
            <ul className="space-y-2">
              {savedFilters.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onLoadSavedFilter?.(f.id)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No hay filtros guardados</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Limpiar todo <RefreshIcon className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          {onSaveFilter && (
            <button
              type="button"
              onClick={handleSave}
              disabled={validFilterCount === 0}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                validFilterCount > 0
                  ? "border-gray-300 text-gray-700 hover:bg-gray-100"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Guardar filtro
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            disabled={validFilterCount === 0}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
              validFilterCount > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Aplicar filtros {validFilterCount > 0 && `(${validFilterCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DEMO APP
// ============================================

export default function App() {
  const [appliedFilters, setAppliedFilters] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const columns = [
    { id: "organization", label: "Organización", type: "select", options: [
      { id: "fab_espana", label: "F&B España - Reg..." },
      { id: "fab_mexico", label: "F&B México" },
      { id: "fab_usa", label: "F&B USA" },
    ]},
    { id: "doc_status", label: "Estado Doc.", type: "select", options: [
      { id: "registered", label: "Registrado", color: "green" },
      { id: "draft", label: "Borrador", color: "yellow" },
      { id: "cancelled", label: "Cancelado", color: "red" },
    ]},
    { id: "doc_type", label: "Doc. Transacción", type: "select", options: [
      { id: "order", label: "Orden estándar" },
      { id: "invoice", label: "Factura de venta" },
      { id: "delivery", label: "Entrega" },
    ]},
    { id: "name", label: "Nombre", type: "string" },
    { id: "amount", label: "Monto", type: "number" },
    { id: "date", label: "Fecha", type: "date" },
  ];

  const handleApply = (filters) => {
    setAppliedFilters(filters);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    console.log("Filtros aplicados:", filters);
  };

  const handleAIFilter = () => {
    alert("🤖 Filtrado con IA - Esta función abriría un modal para describir el filtro en lenguaje natural.");
  };

  return (
      <div className="max-w-5xl mx-auto">

        <TableFilter
          columns={columns}
          onApplyFilters={handleApply}
          onSaveFilter={(name, filters) => console.log("Guardar:", name, filters)}
          onClear={() => setAppliedFilters([])}
          onAIFilter={handleAIFilter}
        />

        {appliedFilters.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filtros aplicados:</h3>
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(appliedFilters, null, 2)}
            </pre>
          </div>
        )}

        {showToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
            <CheckIcon className="w-4 h-4" />
            Filtros aplicados correctamente
          </div>
        )}
      </div>
  );
}
export {TableFilter}