import { useCallback, useEffect, useState } from 'react';

export function MessageBox({ message, onDismiss }: { onDismiss: () => void; message?: string }) {
  const [isVisible, setIsVisible] = useState(!!message);
  const handleDisimss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  }, [onDismiss]);

  useEffect(() => {
    setIsVisible(!!message);
  }, [message]);

  return (
    <div
      className={`w-full rounded-2xl relative bg-yellow-100 transition-all transform-gpu overflow-hidden ${isVisible ? 'max-h-full' : 'max-h-0'}`}>
      <button type="button" className="absolute top-2 right-2 p-2 text-gray-500 cursor-pointer" onClick={handleDisimss}>
        &times;
      </button>
      <div className="p-4 text-red-600">{message || 'No message provided.'}</div>
    </div>
  );
}
