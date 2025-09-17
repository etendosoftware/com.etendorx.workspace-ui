import { useState, type ComponentProps, type FC, type ComponentType, type SVGProps, useId } from "react";
import Eye from "../../../ComponentLibrary/src/assets/icons/eye.svg";
import EyeOff from "../../../ComponentLibrary/src/assets/icons/eye-off.svg";
import Asterisk from "../../../ComponentLibrary/src/assets/icons/asterisk.svg";
import X from "../../../ComponentLibrary/src/assets/icons/x.svg";

interface InputProps extends ComponentProps<"input"> {
  label?: string;
  required?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  clearable?: boolean;
}

const Input: FC<InputProps> = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  icon: Icon,
  className,
  id,
  clearable = true,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const generatedId = useId();

  const inputId = id || generatedId;

  const hasValue = value && value.toString().length > 0;
  const showClearButton = clearable && hasValue && !isPassword;

  const getRightPadding = () => {
    if (isPassword) return "pr-12";
    if (showClearButton) return "pr-10";
    return "pr-3";
  };

  const baseClassName = `w-full ${Icon ? "pl-10" : "pl-3"} ${getRightPadding()} rounded-t tracking-normal h-8 border-0 border-b bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 
    focus:border-b-2 focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none 
    hover:border-(--color-transparent-neutral-100) hover:border-b-2 hover:bg-(--color-transparent-neutral-10)
  `;

  const finalClassName = className ? `${baseClassName} ${className}` : baseClassName;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleClear = () => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className={`flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors ${
            isFocused ? "text-(--color-baseline-100)" : "text-(--color-baseline-80)"
          }`}>
          {label}{" "}
          {required && <Asterisk className="h-3 w-3 fill-(--color-error-main)" data-testid="Asterisk__ce3099" />}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon
              className={`h-4 w-4 transition-colors ${
                isFocused ? "fill-(--color-baseline-100)" : "fill-(--color-transparent-neutral-60)"
              }`}
              data-testid="Icon__ce3099"
              tabIndex={-1}
            />
          </div>
        )}
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={finalClassName}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
            <X
              className={`h-4 w-4 transition-colors ${
                isFocused ? "fill-(--color-baseline-100)" : "fill-(--color-transparent-neutral-60)"
              }`}
              data-testid="X__ce3099"
            />
          </button>
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
            {showPassword ? (
              <EyeOff
                className={`h-4 w-4 transition-colors ${
                  isFocused ? "fill-(--color-baseline-100)" : "fill-(--color-transparent-neutral-60)"
                }`}
                data-testid="EyeOff__ce3099"
              />
            ) : (
              <Eye
                className={`h-4 w-4 transition-colors ${
                  isFocused ? "fill-(--color-baseline-100)" : "fill-(--color-transparent-neutral-60)"
                }`}
                data-testid="Eye__ce3099"
              />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
