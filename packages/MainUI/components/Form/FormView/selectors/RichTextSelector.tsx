import { useCallback, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import DOMPurify from "dompurify";

interface RichTextSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

type ToolbarAction = {
  command: string;
  label: string;
  ariaLabel: string;
  argument?: string;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { command: "bold", label: "B", ariaLabel: "Bold" },
  { command: "italic", label: "I", ariaLabel: "Italic" },
  { command: "underline", label: "U", ariaLabel: "Underline" },
  { command: "insertOrderedList", label: "OL", ariaLabel: "Ordered list" },
  { command: "insertUnorderedList", label: "UL", ariaLabel: "Unordered list" },
];

const sanitize = (html: string): string => DOMPurify.sanitize(html);

const RichTextSelector = ({ field, isReadOnly }: RichTextSelectorProps) => {
  const { setValue, getValues } = useFormContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const fieldName = field.hqlName || field.columnName;
  const currentValue = (getValues(fieldName) as string) || "";

  // Sync initial value into contenteditable
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== currentValue) {
      editorRef.current.innerHTML = sanitize(currentValue);
    }
  }, [currentValue]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setValue(fieldName, html, { shouldDirty: true });
    }
  }, [fieldName, setValue]);

  const execCommand = useCallback((command: string, argument?: string) => {
    document.execCommand(command, false, argument);
    editorRef.current?.focus();
  }, []);

  if (isReadOnly) {
    return (
      <div
        className="w-full min-h-[80px] max-h-[200px] px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700 overflow-auto resize-y"
        data-testid={`RichTextSelector__readonly__${field.id}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized HTML from backend
        dangerouslySetInnerHTML={{ __html: sanitize(currentValue) }}
      />
    );
  }

  return (
    <div
      className="w-full border border-gray-200 rounded-md focus-within:ring-2 focus-within:ring-[var(--color-etendo-main)] focus-within:border-transparent"
      data-testid={`RichTextSelector__${field.id}`}>
      <div
        className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50 rounded-t-md"
        data-testid="RichTextSelector__toolbar">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(action.command, action.argument);
            }}
            className="px-2 py-1 text-xs font-medium text-gray-600 rounded hover:bg-gray-200 transition-colors"
            aria-label={action.ariaLabel}
            data-testid={`RichTextSelector__toolbar__${action.command}`}>
            {action.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="w-full min-h-[120px] max-h-[300px] px-3 py-2 text-sm text-gray-700 outline-none overflow-auto resize-y"
        data-testid={`RichTextSelector__editor__${field.id}`}
      />
    </div>
  );
};

export { RichTextSelector };
export default RichTextSelector;
