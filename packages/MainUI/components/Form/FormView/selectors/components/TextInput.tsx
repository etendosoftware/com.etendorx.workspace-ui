import { TextInputProps } from './types';

export const TextInput = ({
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  label,
  setValue,
  readOnly,
  disabled,
  className,
  onChange,
  ...props
}: TextInputProps) => {
  const isDisabled = disabled || readOnly;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (setValue) {
      setValue(event.target.value);
    }
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <div className="relative w-full font-['Inter'] font-medium">
      {label && (
        <label
          htmlFor={props.id || props.name}
          className={`block mb-1 text-sm ${isDisabled ? 'text-baseline-60' : 'text-baseline-80'}`}>
          {label}
          {props.required && <span className="text-error-main ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-baseline-60">
            <button type="button" onClick={onLeftIconClick} className="p-1 focus:outline-none" disabled={isDisabled}>
              {leftIcon}
            </button>
          </div>
        )}
        <input
          className={`w-full py-1 text-sm border-b border-baseline-60 focus:border-baseline-80 outline-none transition
            ${leftIcon ? 'pl-10' : 'pl-0'} 
            ${rightIcon ? 'pr-10' : 'pr-0'}
            ${isDisabled ? 'bg-baseline-20 text-baseline-60' : 'bg-transparent text-transparent-neutral-100 hover:border-baseline-80'}
            ${className || ''}`}
          onChange={handleChange}
          disabled={isDisabled}
          readOnly={readOnly}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-baseline-60">
            <button type="button" onClick={onRightIconClick} className="p-1 focus:outline-none" disabled={isDisabled}>
              {rightIcon}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
