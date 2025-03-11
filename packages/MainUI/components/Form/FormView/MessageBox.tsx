export function MessageBox({
  isVisible,
  onDismiss,
  message,
}: {
  isVisible: boolean;
  onDismiss: () => void;
  message?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className="w-full p-4 rounded-2xl relative bg-white">
      <button type="button" className="absolute top-2 right-2 p-2 text-gray-500 cursor-pointer" onClick={onDismiss}>
        &times;
      </button>
      <div className="">{message || 'No message provided.'}</div>
    </div>
  );
}
