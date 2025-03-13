import { forwardRef, useCallback, useRef, useState } from 'react';
import CalendarIcon from '../../../../../../ComponentLibrary/src/assets/icons/calendar.svg';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isReadOnly?: boolean;
  error?: boolean;
  helperText?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ name, className = '', label, isReadOnly, error, helperText, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleClick = useCallback(() => {
      if (!isReadOnly && inputRef.current) {
        inputRef.current.showPicker();
      }
    }, [isReadOnly]);

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

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className="w-full font-['Inter'] font-medium">
        {label && (
          <label
            htmlFor={name}
            className={`block mb-1 text-sm ${isReadOnly ? 'text-baseline-60' : 'text-baseline-80'}`}>
            {label}
            {props.required && <span className="text-error-main ml-1">*</span>}
          </label>
        )}

        <div className={`relative w-full ${isReadOnly ? 'pointer-events-none' : ''}`} onClick={handleClick}>
          <input
            type="date"
            id={name}
            name={name}
            ref={handleRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full py-1 pr-8 border-b outline-none text-sm
              ${isFocused ? 'border-baseline-80 bg-baseline-0' : 'border-baseline-60'} 
              ${isReadOnly ? 'bg-baseline-20 text-baseline-60 cursor-not-allowed' : 'bg-transparent text-baseline-90 hover:border-baseline-80'}
              ${error ? 'border-error-main' : ''}
              transition-colors ${className}`}
            readOnly={isReadOnly}
            {...props}
          />
          <div className="absolute right-0 top-0 h-full flex items-center pr-1 pointer-events-none">
            <CalendarIcon fill="currentColor" className="w-5 h-5 text-baseline-60" />
          </div>
        </div>
        {helperText && (
          <div className={`mt-1 text-xs ${error ? 'text-error-main' : 'text-baseline-60'}`}>{helperText}</div>
        )}
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';

export default DateInput;
