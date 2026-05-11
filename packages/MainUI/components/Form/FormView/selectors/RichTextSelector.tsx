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
};

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "arial, helvetica, sans-serif" },
  { label: "Serif", value: "times new roman, serif" },
  { label: "Monospace", value: "courier new, monospace" },
  { label: "Tahoma", value: "tahoma, arial, helvetica, sans-serif" },
  { label: "Verdana", value: "verdana, geneva, sans-serif" },
  { label: "Georgia", value: "georgia, serif" },
  { label: "Impact", value: "impact, sans-serif" },
];

const FONT_SIZES = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
];

const BUTTON_ACTIONS: ToolbarAction[] = [
  { command: "bold", label: "B", ariaLabel: "Bold" },
  { command: "italic", label: "I", ariaLabel: "Italic" },
  { command: "underline", label: "U", ariaLabel: "Underline" },
];

const LIST_ACTIONS: ToolbarAction[] = [
  { command: "insertOrderedList", label: "OL", ariaLabel: "Ordered list" },
  { command: "insertUnorderedList", label: "UL", ariaLabel: "Unordered list" },
];

const ALIGN_ACTIONS: ToolbarAction[] = [
  { command: "justifyLeft", label: "L", ariaLabel: "Align left" },
  { command: "justifyCenter", label: "C", ariaLabel: "Align center" },
  { command: "justifyRight", label: "R", ariaLabel: "Align right" },
];

const sanitize = (html: string): string => DOMPurify.sanitize(html);

const selectClass =
  "h-7 px-1 text-xs text-gray-600 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none cursor-pointer";
const buttonClass = "px-2 py-1 text-xs font-medium text-gray-600 rounded hover:bg-gray-200 transition-colors";

const RichTextSelector = ({ field, isReadOnly }: RichTextSelectorProps) => {
  const { setValue, getValues } = useFormContext();
  const editorRef = useRef<HTMLDivElement>(null);
  const fieldName = field.hqlName || field.columnName;
  const currentValue = (getValues(fieldName) as string) || "";

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
        className="flex flex-wrap items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50 rounded-t-md"
        data-testid="RichTextSelector__toolbar">
        <select
          className={selectClass}
          onChange={(e) => {
            if (e.target.value) execCommand("fontName", e.target.value);
          }}
          defaultValue=""
          aria-label="Font family"
          data-testid="RichTextSelector__toolbar__fontName">
          <option value="" disabled>
            Font
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          onChange={(e) => {
            if (e.target.value) execCommand("fontSize", e.target.value);
          }}
          defaultValue=""
          aria-label="Font size"
          data-testid="RichTextSelector__toolbar__fontSize">
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <span className="w-px h-5 bg-gray-300" />

        {BUTTON_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(action.command);
            }}
            className={buttonClass}
            aria-label={action.ariaLabel}
            data-testid={`RichTextSelector__toolbar__${action.command}`}>
            {action.label}
          </button>
        ))}

        <span className="w-px h-5 bg-gray-300" />

        {ALIGN_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(action.command);
            }}
            className={buttonClass}
            aria-label={action.ariaLabel}
            data-testid={`RichTextSelector__toolbar__${action.command}`}>
            {action.label}
          </button>
        ))}

        <span className="w-px h-5 bg-gray-300" />

        {LIST_ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(action.command);
            }}
            className={buttonClass}
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
