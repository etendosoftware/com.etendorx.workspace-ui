import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import StatusBarField from './StatusBarField';

export default function StatusBar({ fields }: { fields: Record<string, Field> }) {
  return (
    <div className="flex gap-4 bg-gray-200 text-sm p-4 rounded-2xl">
      {Object.entries(fields).map(([key, field]) => (
        <StatusBarField key={key} field={field} />
      ))}
    </div>
  );
}
