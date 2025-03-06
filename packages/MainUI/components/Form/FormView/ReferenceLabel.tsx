import Link from 'next/link';
import { useFormContext } from 'react-hook-form';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';

export default function ReferenceLabel({ field, children }: React.PropsWithChildren<{ field: Field }>) {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);

  return <Link href={`/window/${field.referencedWindowId}/${field.referencedTabId}/${value}`}>{children}</Link>;
}
