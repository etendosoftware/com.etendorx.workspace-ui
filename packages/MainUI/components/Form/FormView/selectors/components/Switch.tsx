import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { forwardRef, useCallback } from 'react';

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  field: Field;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className = '', field, ...props }, ref) => {
    const handleToggle = useCallback(() => {
      if (disabled) return;
      onCheckedChange(!checked);
    }, [checked, disabled, onCheckedChange]);

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={field.name}
        aria-readonly={disabled}
        aria-required={field.isMandatory}
        aria-disabled={disabled}
        aria-details={field.helpComment}
        disabled={disabled}
        onClick={handleToggle}
        ref={ref}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        {...props}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    );
  },
);

Switch.displayName = 'Switch';
