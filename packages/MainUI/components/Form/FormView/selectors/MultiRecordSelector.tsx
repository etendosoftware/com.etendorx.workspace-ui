import type { Field, EntityData } from "@workspaceui/api-client/src/api/types";
import { Chip } from "@mui/material";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import SearchIcon from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { parseCsvIds, parseCsvIdentifiers, toCsv, toCsvIdentifiers } from "@/utils/form/selectors/multiSelectorCsv";
import SelectorModal from "./SelectorModal";

type MultiRecordSelectorProps = {
  field: Field;
  isReadOnly?: boolean;
};

type ChipItem = { id: string; label: string };

const IDENTIFIER_SUFFIX = "$_identifier";

/**
 * Renders a multi-record picker with inline chips + a search button that opens
 * `SelectorModal` in multi-select mode. The form stores the selection as two
 * comma-separated strings (Classic-compatible):
 *   - `field.hqlName`              → "id1,id2,id3"
 *   - `field.hqlName$_identifier`  → "Label 1, Label 2, Label 3"
 *
 * When the form is hydrated from process defaults without `$_identifier`, chips
 * fall back to the raw ID as label (no crash). Identifier resolution via lazy
 * fetch is intentionally out of scope here.
 */
const MultiRecordSelector = ({ field, isReadOnly = false }: MultiRecordSelectorProps) => {
  const { watch, setValue } = useFormContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fieldName = field.hqlName;
  const identifierFieldName = `${fieldName}${IDENTIFIER_SUFFIX}`;

  const idsCsv = watch(fieldName) as string | undefined;
  const labelsCsv = watch(identifierFieldName) as string | undefined;

  const items = useMemo<ChipItem[]>(() => {
    const ids = parseCsvIds(idsCsv);
    const labels = parseCsvIdentifiers(labelsCsv);
    return ids.map((id, idx) => ({ id, label: labels[idx] ?? id }));
  }, [idsCsv, labelsCsv]);

  const persistSelection = useCallback(
    (nextItems: ChipItem[]) => {
      setValue(fieldName, toCsv(nextItems.map((i) => i.id)), { shouldValidate: true, shouldDirty: true });
      setValue(identifierFieldName, toCsvIdentifiers(nextItems.map((i) => i.label)), { shouldDirty: true });
    },
    [fieldName, identifierFieldName, setValue]
  );

  const handleRemove = useCallback(
    (id: string) => {
      persistSelection(items.filter((item) => item.id !== id));
    },
    [items, persistSelection]
  );

  const handleConfirm = useCallback(
    (records: EntityData[]) => {
      const nextItems: ChipItem[] = records.map((record) => ({
        id: String(record.id),
        label: String(record._identifier ?? record.id),
      }));
      persistSelection(nextItems);
    },
    [persistSelection]
  );

  const initialSelectedIds = useMemo(() => items.map((i) => i.id), [items]);
  const initialSelectedIdentifiersById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i.label])), [items]);

  return (
    <>
      <div className="flex w-full items-center gap-1" data-testid={`MultiRecordSelectorRoot__${field.id}`}>
        <div className="flex-grow min-w-0 font-['Inter'] font-medium">
          <div
            className={[
              "w-full flex flex-nowrap items-center gap-1",
              "px-3 py-1 rounded-t tracking-normal h-10.5 overflow-x-auto overflow-y-hidden",
              "border-0 border-b-2 transition-colors",
              "bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30)",
              "text-(--color-transparent-neutral-80) text-sm leading-5",
              isReadOnly
                ? "cursor-not-allowed bg-transparent rounded-t-lg border-dotted border-(--color-transparent-neutral-40)"
                : "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)",
            ].join(" ")}
            data-testid={`MultiRecordSelectorChips__${field.id}`}>
            {items.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                size="small"
                className="flex-shrink-0"
                onDelete={isReadOnly ? undefined : () => handleRemove(item.id)}
                data-testid={`MultiRecordSelectorChip__${item.id}`}
              />
            ))}
          </div>
        </div>
        {!isReadOnly && (
          <IconButton
            onClick={() => setIsModalOpen(true)}
            className="w-8 h-8 flex-shrink-0"
            tooltip="Search"
            tooltipPosition="top"
            data-testid={`MultiRecordSelectorOpen__${field.id}`}>
            <SearchIcon className="w-5 h-5 fill-current" />
          </IconButton>
        )}
      </div>
      {isModalOpen && (
        <SelectorModal
          field={field}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={() => undefined}
          multiSelect
          initialSelectedIds={initialSelectedIds}
          initialSelectedIdentifiersById={initialSelectedIdentifiersById}
          onMultiSelect={handleConfirm}
        />
      )}
    </>
  );
};

export { MultiRecordSelector };
export default MultiRecordSelector;
