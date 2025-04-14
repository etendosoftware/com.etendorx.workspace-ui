import { memo, useMemo } from 'react';
import Link from 'next/link';
import { useFormContext } from 'react-hook-form';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldReference } from '@/utils';
import BaseLabel from '@/components/Label';

function LabelCmp({ field }: { field: Field }) {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);
  const isReference = useMemo(() => isEntityReference(getFieldReference(field.column?.reference)), [field]);

  if (value && isReference) {
    return (
      <Link href={`/window/${field.referencedWindowId}/${field.referencedTabId}/${value}`}>
        <BaseLabel name={field.name} htmlFor={field.hqlName} link />
      </Link>
    );
  }

  return <BaseLabel name={field.name} htmlFor={field.hqlName} />;
}

const Label = memo(LabelCmp, () => true);
export { Label };
export default Label;
