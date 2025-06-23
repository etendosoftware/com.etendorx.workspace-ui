import type { Field } from "@workspaceui/api-client/src/api/types";
import StatusBarField from "./StatusBarField";

export default function StatusBar({ fields }: { fields: Record<string, Field> }) {
  return (
    <div className="flex gap-4 bg-gray-100/50 shadow text-sm px-4 py-3 rounded-xl">
      {Object.entries(fields).map(([key, field]) => (
        <StatusBarField key={key} field={field} />
      ))}
    </div>
  );
}
