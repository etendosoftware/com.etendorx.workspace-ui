import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FilterIconSVG from "../../assets/icons/filter.svg";
import ChevronDownIconSVG from "../../assets/icons/chevron-down.svg";
import TrashIconSVG from "../../assets/icons/trash.svg";
import PlusIconSVG from "../../assets/icons/plus.svg";
import RefreshIconSVG from "../../assets/icons/refresh-cw.svg";
import CheckIconSVG from "../../assets/icons/check.svg";

// ============================================
// HOOKS
// ============================================

const useClickOutside = (ref: React.RefObject<any>, handler: () => void): void => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
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

const useEscapeKey = (handler: () => void): void => {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => e.key === "Escape" && handler();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [handler]);
};

const useWindowResize = (handler: () => void): void => {
  useEffect(() => {
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [handler]);
};

// ============================================
// MENU COMPONENT
// ============================================

interface MenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  offsetX?: number;
  offsetY?: number;
}

const Menu = ({ anchorEl, onClose, children, className = "", offsetX = 0, offsetY = 0 }: MenuProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!anchorEl) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      calculatePosition();
      setVisible(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [anchorEl, calculatePosition]);

  const handleClose = () => {
    setVisible(false);
    timeoutRef.current = setTimeout(() => onClose(), 150);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  useClickOutside(menuRef, handleClose);
  useEscapeKey(handleClose);
  useWindowResize(calculatePosition);

  if (!anchorEl) return null;

  return createPortal(
    <div
      role="menu"
      ref={menuRef}
      className={`fixed z-[9999] bg-white transition-opacity duration-150 rounded-lg border border-gray-200 etendo-ignore-click-outside ${visible ? "opacity-100" : "opacity-0"} ${className}`}
      style={{
        top: position.y,
        left: position.x,
        visibility: visible ? "visible" : "hidden",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
        minWidth: anchorEl.offsetWidth,
      }}>
      {children}
    </div>,
    document.body
  );
};

// ============================================
// SELECT COMPONENT
// ============================================

interface SelectProps {
  options: { id: string; label: string; color?: string }[];
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  size?: "normal" | "small";
  onSearch?: (term: string) => void;
  onFocus?: () => void;
}

const Select = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  searchable = true,
  size = "normal",
  onSearch = undefined,
  onFocus = undefined,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const filteredOptions = useMemo(() => {
    if (onSearch) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm, onSearch]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((p) => (p < filteredOptions.length - 1 ? p + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((p) => (p > 0 ? p - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex])
          handleSelect(filteredOptions[highlightedIndex].id);
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        break;
    }
  };

  useEffect(() => {
    if (isOpen && searchInputRef.current && searchable) searchInputRef.current.focus();
  }, [isOpen, searchable]);
  useEffect(() => {
    if (isOpen && onFocus) onFocus();
  }, [isOpen, onFocus]);

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

  const getTriggerStateClasses = () => {
    if (disabled) return "bg-gray-50 border-gray-200 border-dotted cursor-not-allowed opacity-60";
    if (isOpen) return "bg-blue-50 border-blue-600 text-blue-600";
    return "bg-gray-50 border-gray-300 hover:border-gray-400 hover:bg-gray-100";
  };

  const getLabelTextClasses = () => {
    const sizeClass = size === "small" ? "text-xs" : "text-sm";
    if (!selectedOption) return `${sizeClass} text-gray-400`;
    return `${sizeClass} ${isOpen ? "text-blue-600 font-medium" : "text-gray-800 font-medium"}`;
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        className={`relative flex items-center justify-between rounded-t border-0 border-b-2 transition-all cursor-pointer select-none ${sizeClasses} ${getTriggerStateClasses()}`}>
        {showAsTag && selectedOption?.color ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[selectedOption.color as keyof typeof colorClasses] || colorClasses.gray}`}>
            {selectedOption.label}
          </span>
        ) : (
          <span className={`truncate pr-2 ${getLabelTextClasses()}`}>
            {selectedOption?.label || placeholder}
          </span>
        )}
        <ChevronDownIconSVG
          className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-blue-600" : "text-gray-400"}`}
        />
      </div>

      <Menu
        anchorEl={isOpen ? triggerRef.current : null}
        onClose={() => {
          setIsOpen(false);
          setSearchTerm("");
        }}
        offsetY={4}
        className="py-1">
        {searchable && (
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onSearch?.(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            />
          </div>
        )}
        <ul ref={listRef} className="max-h-48 overflow-y-auto list-none m-0 p-0">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <li key={opt.id} className="block">
                <button
                  type="button"
                  aria-selected={value === opt.id}
                  onClick={() => handleSelect(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(opt.id);
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between ${highlightedIndex === idx ? "bg-gray-50" : ""} ${value === opt.id ? "bg-gray-50 font-medium" : ""} hover:bg-gray-50 border-none bg-transparent`}>
                  {opt.color ? (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[opt.color as keyof typeof colorClasses] || colorClasses.gray}`}>
                      {opt.label}
                    </span>
                  ) : (
                    <span className={value === opt.id ? "text-gray-900" : "text-gray-700"}>{opt.label}</span>
                  )}
                  {value === opt.id && (
                    <CheckIconSVG className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
                  )}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-gray-400">No se encontraron opciones</li>
          )}
        </ul>
      </Menu>
    </>
  );
};

// ============================================
// OPERATORS
// ============================================

const getOperatorsForType = (type: string, t: (key: string) => string) => {
  const base = [
    { id: "equals", label: `= ${t("advancedFilters.operators.equals")}` },
    { id: "not_equals", label: `≠ ${t("advancedFilters.operators.not_equals")}` },
  ];
  switch (type) {
    case "string":
      return [
        ...base,
        { id: "contains", label: t("advancedFilters.operators.contains") },
        { id: "not_contains", label: t("advancedFilters.operators.not_contains") },
        { id: "starts_with", label: t("advancedFilters.operators.starts_with") },
        { id: "ends_with", label: t("advancedFilters.operators.ends_with") },
        { id: "is_empty", label: t("advancedFilters.operators.is_empty") },
        { id: "is_not_empty", label: t("advancedFilters.operators.is_not_empty") },
      ];
    case "number":
      return [
        ...base,
        { id: "greater_than", label: `> ${t("advancedFilters.operators.greater_than")}` },
        { id: "less_than", label: `< ${t("advancedFilters.operators.less_than")}` },
        { id: "greater_or_equal", label: `≥ ${t("advancedFilters.operators.greater_or_equal")}` },
        { id: "less_or_equal", label: `≤ ${t("advancedFilters.operators.less_or_equal")}` },
      ];
    case "date":
      return [
        ...base,
        { id: "before", label: t("advancedFilters.operators.before") },
        { id: "after", label: t("advancedFilters.operators.after") },
        { id: "today", label: t("advancedFilters.operators.today") },
        { id: "this_week", label: t("advancedFilters.operators.this_week") },
        { id: "this_month", label: t("advancedFilters.operators.this_month") },
      ];
    case "boolean":
      return [
        { id: "is_true", label: t("advancedFilters.operators.is_true") },
        { id: "is_false", label: t("advancedFilters.operators.is_false") },
      ];
    case "select":
      return [
        { id: "equals", label: `= ${t("advancedFilters.operators.equals")}` },
        { id: "not_equals", label: `≠ ${t("advancedFilters.operators.not_equals")}` },
      ];
    default:
      return base;
  }
};

// ============================================
// FILTER CONDITION ROW (inside a group)
// ============================================

interface FilterConditionRowProps {
  condition: any;
  columns: any[];
  isFirst: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  size?: "small" | "normal";
  onLoadOptions?: (columnId: string, searchQuery: string) => void;
  t: (key: string) => string;
}

const FilterConditionRow = memo(
  ({ condition, columns, isFirst, onUpdate, onDelete, size = "small", onLoadOptions, t }: FilterConditionRowProps) => {
    const selectedColumn = columns.find((c) => c.id === condition.column);
    const operators = selectedColumn ? getOperatorsForType(selectedColumn.type, t) : [];
    const columnOptions = columns.map((c) => ({ id: c.id, label: c.label }));
    const logicalOptions = [
      { id: "AND", label: t("advancedFilters.operators.and") },
      { id: "OR", label: t("advancedFilters.operators.or") },
    ];
    const valueOptions = selectedColumn?.options || [];
    const showValueSelect = selectedColumn?.type === "select";
    const hideValueInput = [
      "is_empty",
      "is_not_empty",
      "is_true",
      "is_false",
      "today",
      "this_week",
      "this_month",
    ].includes(condition.operator);

    const inputSizeClasses = size === "small" ? "h-8 px-2 text-xs" : "h-10 px-3 text-sm";

    const getInputType = () => {
      if (selectedColumn?.type === "number") return "number";
      if (selectedColumn?.type === "date") return "date";
      return "text";
    };

    const getInputClasses = () => {
      const baseClasses = `w-full rounded-t border-0 border-b-2 transition-all ${inputSizeClasses}`;
      if (!condition.operator) {
        return `${baseClasses} bg-gray-50 border-gray-200 border-dotted cursor-not-allowed`;
      }
      return `${baseClasses} bg-gray-50 border-gray-300 hover:border-gray-400 focus:bg-blue-50 focus:border-blue-600 focus:outline-none`;
    };

    const getEmptyInputClasses = () => {
      return `bg-gray-100 rounded-t border-b-2 border-gray-200 border-dotted ${size === "small" ? "h-8" : "h-10"}`;
    };

    const renderValueInput = () => {
      if (hideValueInput) {
        return <div className={getEmptyInputClasses()} />;
      }
      if (showValueSelect) {
        return (
          <Select
            options={valueOptions}
            value={condition.value}
            onChange={(v) => onUpdate(condition.id, { value: v })}
            placeholder={t("advancedFilters.value")}
            disabled={!condition.operator}
            size={size}
            onSearch={onLoadOptions ? (val) => onLoadOptions(condition.column, val) : undefined}
            onFocus={onLoadOptions ? () => onLoadOptions(condition.column, "") : undefined}
          />
        );
      }
      return (
        <input
          type={getInputType()}
          value={condition.value}
          onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
          disabled={!condition.operator}
          placeholder={t("advancedFilters.value")}
          className={getInputClasses()}
        />
      );
    };

    return (
      <div className="flex items-center gap-2 py-1.5">
        {/* Logical Operator / "Donde" */}
        <div className="w-14 flex-shrink-0">
          {isFirst ? (
            <span className="text-xs text-gray-500 font-medium">{t("advancedFilters.where")}</span>
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
            placeholder={t("advancedFilters.column")}
            size={size}
          />
        </div>

        {/* Operator */}
        <div className="flex-1 min-w-[90px]">
          <Select
            options={operators}
            value={condition.operator}
            onChange={(v) => onUpdate(condition.id, { operator: v })}
            placeholder={t("advancedFilters.condition")}
            disabled={!condition.column}
            size={size}
          />
        </div>

        {/* Value */}
        <div className="flex-1 min-w-[90px]">
          {renderValueInput()}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(condition.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
          aria-label="Eliminar">
          <TrashIconSVG className="w-3.5 h-3.5 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
        </button>
      </div>
    );
  }
);

// ============================================
// SIMPLE FILTER ROW (top level condition)
// ============================================

interface FilterRowProps {
  condition: any;
  columns: any[];
  isFirst: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onLoadOptions?: (columnId: string, searchQuery: string) => void;
  t: (key: string) => string;
}

const FilterRow = memo(({ condition, columns, isFirst, onUpdate, onDelete, onLoadOptions, t }: FilterRowProps) => {
  const selectedColumn = columns.find((c) => c.id === condition.column);
  const operators = selectedColumn ? getOperatorsForType(selectedColumn.type, t) : [];
  const columnOptions = columns.map((c) => ({ id: c.id, label: c.label }));
  const logicalOptions = [
    { id: "AND", label: t("advancedFilters.operators.and") },
    { id: "OR", label: t("advancedFilters.operators.or") },
  ];
  const valueOptions = selectedColumn?.options || [];
  const showValueSelect = selectedColumn?.type === "select";
  const hideValueInput = [
    "is_empty",
    "is_not_empty",
    "is_true",
    "is_false",
    "today",
    "this_week",
    "this_month",
  ].includes(condition.operator);

  const handleSearch = useCallback(
    (val: string) => {
      if (onLoadOptions && condition.column) {
        onLoadOptions(condition.column, val);
      }
    },
    [onLoadOptions, condition.column]
  );

  const handleFocus = useCallback(() => {
    if (onLoadOptions && condition.column) {
      onLoadOptions(condition.column, "");
    }
  }, [onLoadOptions, condition.column]);

  const getInputType = () => {
    if (selectedColumn?.type === "number") return "number";
    if (selectedColumn?.type === "date") return "date";
    return "text";
  };

  const getInputClasses = () => {
    const baseClasses = "w-full h-10 px-3 text-sm rounded-t border-0 border-b-2 transition-all";
    if (!condition.operator) {
      return `${baseClasses} bg-gray-50 border-gray-200 border-dotted cursor-not-allowed`;
    }
    return `${baseClasses} bg-gray-50 border-gray-300 hover:border-gray-400 focus:bg-blue-50 focus:border-blue-600 focus:outline-none`;
  };

  const renderValueInput = () => {
    if (hideValueInput) {
      return <div className="h-10 bg-gray-100 rounded-t border-b-2 border-gray-200 border-dotted" />;
    }
    if (showValueSelect) {
      return (
        <Select
          options={valueOptions}
          value={condition.value}
          onChange={(v) => onUpdate(condition.id, { value: v })}
          placeholder={t("advancedFilters.value")}
          disabled={!condition.operator}
          onSearch={onLoadOptions ? handleSearch : undefined}
          onFocus={onLoadOptions ? handleFocus : undefined}
        />
      );
    }
    return (
      <input
        type={getInputType()}
        value={condition.value}
        onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
        disabled={!condition.operator}
        placeholder={t("advancedFilters.value")}
        className={getInputClasses()}
      />
    );
  };

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Logical Operator / "Donde" */}
      <div className="w-20 flex-shrink-0">
        {isFirst ? (
          <span className="text-sm text-gray-600 font-medium">{t("advancedFilters.where")}</span>
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
          placeholder={t("advancedFilters.column")}
        />
      </div>

      {/* Operator */}
      <div className="flex-1 min-w-[120px]">
        <Select
          options={operators}
          value={condition.operator}
          onChange={(v) => onUpdate(condition.id, { operator: v })}
          placeholder={t("advancedFilters.condition")}
          disabled={!condition.column}
        />
      </div>

      {/* Value */}
      <div className="flex-1 min-w-[120px]">
        {renderValueInput()}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(condition.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
        aria-label="Eliminar">
        <TrashIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
      </button>
    </div>
  );
});

// ============================================
// FILTER GROUP (as a row with nested conditions)
// ============================================

interface FilterGroupProps {
  group: any;
  isFirst: boolean;
  columns: any[];
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onUpdateCondition: (groupId: string, conditionId: string, updates: any) => void;
  onDeleteCondition: (groupId: string, conditionId: string) => void;
  onAddCondition: (groupId: string) => void;
  onLoadOptions?: (columnId: string, searchQuery: string) => void;
  t: (key: string) => string;
}

const FilterGroup = ({
  group,
  isFirst,
  columns,
  onUpdate,
  onDelete,
  onUpdateCondition,
  onDeleteCondition,
  onAddCondition,
  onLoadOptions,
  t,
}: FilterGroupProps) => {
  const logicalOptions = [
    { id: "AND", label: t("advancedFilters.operators.and") },
    { id: "OR", label: t("advancedFilters.operators.or") },
  ];

  return (
    <div className="flex gap-3 py-2">
      {/* Logical Operator for the group row */}
      <div className="w-20 flex-shrink-0 pt-2">
        {isFirst ? (
          <span className="text-sm text-gray-600 font-medium">{t("advancedFilters.where")}</span>
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
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("advancedFilters.column")}
            </span>
          </div>
          <div className="flex-1 min-w-[90px]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("advancedFilters.condition")}
            </span>
          </div>
          <div className="flex-1 min-w-[90px]">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t("advancedFilters.value")}
            </span>
          </div>
          <div className="w-8 flex-shrink-0" />
        </div>

        {/* Conditions inside group */}
        {group.conditions.map((cond: any, idx: number) => (
          <FilterConditionRow
            key={cond.id}
            condition={cond}
            columns={columns}
            isFirst={idx === 0}
            onUpdate={(condId, updates) => onUpdateCondition(group.id, condId, updates)}
            onDelete={(condId) => onDeleteCondition(group.id, condId)}
            size="small"
            onLoadOptions={onLoadOptions}
            t={t}
          />
        ))}

        {/* Add condition inside group */}
        <button
          type="button"
          onClick={() => onAddCondition(group.id)}
          className="flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
          {t("advancedFilters.addCondition")}{" "}
          <PlusIconSVG className="w-3 h-3 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
        </button>
      </div>

      {/* Delete group */}
      <button
        type="button"
        onClick={() => onDelete(group.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 self-start mt-1"
        aria-label="Eliminar grupo">
        <TrashIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
      </button>
    </div>
  );
};

// ============================================
// TABLE FILTER MAIN COMPONENT
// ============================================

interface TableFilterProps {
  columns: any[];
  onApplyFilters: (filters: any[]) => void;
  onClear?: () => void;
  onLoadOptions?: (columnId: string, searchQuery: string) => void;
  initialFilters?: any[];
  t: (key: string) => string;
}

const TableFilter = ({ columns, onApplyFilters, onClear, onLoadOptions, initialFilters, t }: TableFilterProps) => {
  const genId = (): string =>
    Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((b) => b.toString(36))
      .join("");
  const createEmptyCondition = (): {
    id: string;
    column: string;
    operator: string;
    value: string;
    logicalOperator: string;
  } => ({ id: genId(), column: "", operator: "", value: "", logicalOperator: "AND" });

  // Items can be either conditions or groups
  const [items, setItems] = useState(() => {
    if (initialFilters && initialFilters.length > 0) {
      return initialFilters;
    }
    return [{ type: "condition", ...createEmptyCondition() }];
  });

  // Count valid filters
  const countValidFilters = (): number => {
    let count = 0;
    for (const item of items) {
      if (item.type === "condition") {
        if (item.column && item.operator) count++;
      } else if (item.type === "group") {
        for (const c of item.conditions) {
          if (c.column && c.operator) count++;
        }
      }
    }
    return count;
  };

  const validFilterCount = countValidFilters();

  // Add a simple condition
  const handleAddCondition = (): void => {
    setItems((prev) => [...prev, { type: "condition", ...createEmptyCondition() }]);
  };

  // Add a group
  const handleAddGroup = (): void => {
    setItems((prev) => [
      ...prev,
      {
        type: "group",
        id: genId(),
        logicalOperator: "AND",
        conditions: [createEmptyCondition()],
      },
    ]);
  };

  // Update a top-level condition
  const handleUpdateCondition = (id: string, updates: any): void => {
    setItems((prev) =>
      prev.map((item) => (item.type === "condition" && item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Delete a top-level condition
  const handleDeleteCondition = (id: string): void => {
    setItems((prev) => {
      const updated = prev.filter((item) => !(item.type === "condition" && item.id === id));
      if (updated.length === 0) return [{ type: "condition", ...createEmptyCondition() }];
      return updated;
    });
  };

  // Update a group
  const handleUpdateGroup = (id: string, updates: any): void => {
    setItems((prev) => prev.map((item) => (item.type === "group" && item.id === id ? { ...item, ...updates } : item)));
  };

  // Delete a group
  const handleDeleteGroup = (id: string): void => {
    setItems((prev) => {
      const updated = prev.filter((item) => !(item.type === "group" && item.id === id));
      if (updated.length === 0) return [{ type: "condition", ...createEmptyCondition() }];
      return updated;
    });
  };

  // Update condition inside a group
  const handleUpdateGroupCondition = (groupId: string, conditionId: string, updates: any): void => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type === "group" && item.id === groupId) {
          return {
            ...item,
            conditions: item.conditions.map((c: any) => (c.id === conditionId ? { ...c, ...updates } : c)),
          };
        }
        return item;
      })
    );
  };

  // Delete condition inside a group
  const handleDeleteGroupCondition = (groupId: string, conditionId: string): void => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type === "group" && item.id === groupId) {
          const newConditions = item.conditions.filter((c: any) => c.id !== conditionId);
          // If no conditions left, keep at least one empty
          if (newConditions.length === 0) {
            return { ...item, conditions: [createEmptyCondition()] };
          }
          return { ...item, conditions: newConditions };
        }
        return item;
      })
    );
  };

  // Add condition inside a group
  const handleAddGroupCondition = (groupId: string): void => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.type === "group" && item.id === groupId) {
          return { ...item, conditions: [...item.conditions, createEmptyCondition()] };
        }
        return item;
      })
    );
  };

  // Clear all - only clears the UI, execution happens on Apply
  const handleClearAll = (): void => {
    setItems([{ type: "condition", ...createEmptyCondition() }]);
  };

  const processFilterItem = (item: any): any => {
    if (item.type === "condition") {
      return item.column && item.operator ? { type: "condition", ...item } : null;
    }
    const validConditions = item.conditions.filter((c: any) => c.column && c.operator);
    return validConditions.length > 0 ? { ...item, conditions: validConditions } : null;
  };

  // Apply filters
  const handleApply = (): void => {
    const result = items.map(processFilterItem).filter(Boolean);
    if (result.length === 0) {
      onClear?.();
    }
    onApplyFilters(result);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className={"flex items-center gap-2  py-2 text-sm font-medium rounded-md transition-all"}>
          <FilterIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
          {t("advancedFilters.title")}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Headers */}
        <div className="flex items-center gap-3 pb-2 mb-2">
          <div className="w-20 flex-shrink-0" />
          <div className="flex-1 min-w-[120px]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("advancedFilters.column")}
            </span>
          </div>
          <div className="flex-1 min-w-[120px]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("advancedFilters.condition")}
            </span>
          </div>
          <div className="flex-1 min-w-[120px]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("advancedFilters.value")}
            </span>
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
                  onLoadOptions={onLoadOptions}
                  t={t}
                />
              );
            }
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
                onLoadOptions={onLoadOptions}
                t={t}
              />
            );
          })}
        </div>

        {/* Add buttons */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleAddCondition}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            {t("advancedFilters.addCondition")}{" "}
            <PlusIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
          </button>
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            {t("advancedFilters.addGroup")}{" "}
            <PlusIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
          {t("advancedFilters.clearAll")}{" "}
          <RefreshIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleApply}
            className={
              "px-5 py-2 text-sm font-medium rounded-lg transition-colors bg-(--color-dynamic-main) text-white hover:bg-blue-700"
            }>
            {t("advancedFilters.applyFilters")} {validFilterCount > 0 && `(${validFilterCount})`}
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
  const [appliedFilters, setAppliedFilters] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);

  const columns = [
    {
      id: "organization",
      label: "Organización",
      type: "select",
      options: [
        { id: "fab_espana", label: "F&B España - Reg..." },
        { id: "fab_mexico", label: "F&B México" },
        { id: "fab_usa", label: "F&B USA" },
      ],
    },
    {
      id: "doc_status",
      label: "Estado Doc.",
      type: "select",
      options: [
        { id: "registered", label: "Registrado", color: "green" },
        { id: "draft", label: "Borrador", color: "yellow" },
        { id: "cancelled", label: "Cancelado", color: "red" },
      ],
    },
    {
      id: "doc_type",
      label: "Doc. Transacción",
      type: "select",
      options: [
        { id: "order", label: "Orden estándar" },
        { id: "invoice", label: "Factura de venta" },
        { id: "delivery", label: "Entrega" },
      ],
    },
    { id: "name", label: "Nombre", type: "string" },
    { id: "amount", label: "Monto", type: "number" },
    { id: "date", label: "Fecha", type: "date" },
  ];

  const handleApply = (filters: any[]): void => {
    setAppliedFilters(filters);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    console.log("Filtros aplicados:", filters);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <TableFilter columns={columns} onApplyFilters={handleApply} onClear={() => setAppliedFilters([])} t={(k) => k} />

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
          <CheckIconSVG className="w-4 h-4 fill-(--color-dynamic-main) group-hover:fill-(--color-dynamic-main)" />
          Filtros aplicados correctamente
        </div>
      )}
    </div>
  );
}
export { TableFilter };
