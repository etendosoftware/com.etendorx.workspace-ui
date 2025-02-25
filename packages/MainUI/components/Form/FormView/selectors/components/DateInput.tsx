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
        className={`w-full h-12 bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none transition ${className}`}
        {...props}
      />
    </div>
  );
});

DateInput.displayName = 'DateInput';
