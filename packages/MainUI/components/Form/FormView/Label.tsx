import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { isEntityReference } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { getFieldReference } from '@/utils';
import ReferenceLabel from './ReferenceLabel';

const Content = ({ field, link }: { field: Field; link?: boolean }) => (
  <label
    htmlFor={field.hqlName}
    className={`block text-sm font-medium select-none truncate ${link ? 'text-blue-700 cursor-pointer' : 'text-gray-700'}`}>
    {field.name}
  </label>
);

export default function Label({ field }: { field: Field }) {
  if (isEntityReference(getFieldReference(field))) {
    return (
      <ReferenceLabel field={field}>
        <Content field={field} link />
      </ReferenceLabel>
    );
  }

  return <Content field={field} />;
}
