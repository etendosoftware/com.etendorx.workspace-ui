import { useDatasource } from "@/hooks/useDatasource";
import { useTheme } from "@mui/material";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import type { Option } from "@workspaceui/api-client/src/api/types";
import { memo, useMemo } from "react";
import type { DatabaseSelectSelector } from "../../Form/FormView/types";

const DBSelectSelector = memo(({ value, name, title, onChange, readOnly, entity }: DatabaseSelectSelector) => {
  const theme = useTheme();
  const { records = [], loading } = useDatasource({ entity });

  const options = useMemo<Option<string>[]>(
    () =>
      records.map((record) => ({
        id: String(record.id || ""),
        title: String(record._identifier || record.name || ""),
        value: String(record.id || ""),
      })),
    [records],
  );

  const currentValue = useMemo(() => options.find((opt) => opt.value === value) || null, [options, value]);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      title={title}
      options={options}
      getOptionLabel={(option) => option.title}
      onChange={(_event, newValue) => onChange(newValue?.value || "")}
      disabled={readOnly || loading}
      name={name}
      value={currentValue}
    />
  );
});

DBSelectSelector.displayName = "DatabaseSelectSelector";

export default DBSelectSelector;
