import { useMemo } from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "./components/Select";
import type { SelectProps } from "./components/types";

export const ListSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const options = useMemo<SelectProps["options"]>(() => {
    if (field.refList) {
      return Array.from(field.refList).map((item) => ({
        id: item.value,
        label: item.label,
      }));
    }

    return [];
  }, [field.refList]);

  return <Select name={field.hqlName} options={options} isReadOnly={isReadOnly} field={field} />;
};
