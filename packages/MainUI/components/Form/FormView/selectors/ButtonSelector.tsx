import { useCallback, useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useProcessDefinitionTrigger } from "@/hooks/useProcessDefinitionTrigger";
import ProcessDefinitionModal from "@/components/ProcessModal/ProcessDefinitionModal";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";

interface ButtonSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="32"
      strokeDashoffset="12"
      strokeLinecap="round"
    />
  </svg>
);

const ButtonSelector = ({ field, isReadOnly }: ButtonSelectorProps) => {
  const { getValues } = useFormContext();
  const { isProcessModalOpen, processButtonData, isLoading, triggerProcess, closeProcessModal } =
    useProcessDefinitionTrigger(field);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const processId = field.selector?.processDefinitionId as string | undefined;
  const hasRefList = field.refList && field.refList.length > 0;

  const handleClick = useCallback(() => {
    if (isReadOnly || isLoading) return;

    if (hasRefList) {
      setIsDropdownOpen((prev) => !prev);
    } else if (processId) {
      triggerProcess(processId);
    }
  }, [isReadOnly, isLoading, hasRefList, processId, triggerProcess]);

  const handleRefListSelect = useCallback(
    (_value: string) => {
      setIsDropdownOpen(false);
      if (processId) {
        triggerProcess(processId);
      }
    },
    [processId, triggerProcess]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDropdownOpen]);

  return (
    <>
      <div className="relative" ref={dropdownRef} data-testid={`ButtonSelector__${field.id}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={isReadOnly || isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-colors
            border-gray-300 bg-white text-gray-700
            hover:bg-gray-50 hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[var(--color-etendo-main)] focus:ring-offset-1">
          {isLoading && <Spinner size={14} />}
          {field.name}
          {hasRefList && (
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {isDropdownOpen && hasRefList && (
          <div className="absolute z-10 mt-1 w-full min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg">
            {field.refList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRefListSelect(item.value)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                data-testid={`ButtonSelector__refList__${item.id}`}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isProcessModalOpen && processButtonData && (
        <ProcessDefinitionModal
          type={PROCESS_TYPES.PROCESS_DEFINITION}
          open={isProcessModalOpen}
          onClose={closeProcessModal}
          button={processButtonData}
          contextRecord={getValues()}
          onSuccess={closeProcessModal}
          data-testid={`ProcessDefinitionModal__${field.id}`}
        />
      )}
    </>
  );
};

export { ButtonSelector };
export default ButtonSelector;
