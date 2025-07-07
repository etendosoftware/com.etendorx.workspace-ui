import { memo, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { getFieldReference } from "@/utils";
import BaseLabel from "@/components/Label";
import { useRedirect } from "@/hooks/navigation/useRedirect";

function LabelCmp({ field }: { field: Field }) {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);
  const isReference = useMemo(() => isEntityReference(getFieldReference(field.column?.reference)), [field]);
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();

  if (field.fieldGroup !== "audit" && value && isReference && field.column.referenceSearchKey$_identifier !== "Location") {
    return (
      <BaseLabel
        name={`${field.name} ⤴️`}
        htmlFor={field.hqlName}
        onClick={(e) => handleClickRedirect(e, field.referencedWindowId, field.name)}
        onKeyDown={(e) => handleKeyDownRedirect(e, field.referencedWindowId, field.name)}
        link
      />
    );
  }

  return <BaseLabel name={field.name} htmlFor={field.hqlName} />;
}

const Label = memo(LabelCmp, () => true);
export { Label };
export default Label;
