import { forwardRef, useCallback, useRef } from 'react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ name, className = '', ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement>();

  const handleClick = useCallback(() => {
    inputRef.current?.showPicker();
  }, []);

  const handleRef = useCallback(
    (node: HTMLInputElement) => {
      inputRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  return (
    <div className="flex flex-col space-y-1" onClick={handleClick}>
      <input
        type="date"
        id={name}
        name={name}
        ref={handleRef}
        className={`bg-white rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${className}`}
        {...props}
      />
    </div>
  );
});

DateInput.displayName = 'DateInput';
