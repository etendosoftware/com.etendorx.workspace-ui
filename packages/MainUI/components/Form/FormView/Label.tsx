import { memo, useMemo } from 'react';
import Link from 'next/link';
import { useFormContext } from 'react-hook-form';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldReference } from '@/utils';

const Content = ({ field, link }: { field: Field; link?: boolean }) => (
  <label
    htmlFor={field.hqlName}
    className={`block text-sm font-medium select-none truncate ${link ? 'text-blue-700 cursor-pointer' : 'text-gray-700'}`}>
    {field.name}
  </label>
);

function LabelCmp({ field }: { field: Field }) {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);
  const isReference = useMemo(() => isEntityReference(getFieldReference(field.column.reference)), [field]);

  if (value && isReference) {
    return (
      <Link href={`/window/${field.referencedWindowId}/${field.referencedTabId}/${value}`}>
        <Content field={field} link />
      </Link>
    );
  }

  return <Content field={field} />;
}

const Label = memo(LabelCmp, () => true);
export { Label };
export default Label;
