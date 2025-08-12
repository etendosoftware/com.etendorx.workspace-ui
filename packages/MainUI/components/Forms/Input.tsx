import { useState, type ComponentProps, type FC, type ComponentType, type SVGProps, useId } from "react";
import Eye from "../../../ComponentLibrary/src/assets/icons/eye.svg";
import EyeOff from "../../../ComponentLibrary/src/assets/icons/eye-off.svg";
import Asterisk from "../../../ComponentLibrary/src/assets/icons/asterisk.svg";

interface InputProps extends ComponentProps<"input"> {
  label?: string;
  required?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
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
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const generatedId = useId();

  const inputId = id || generatedId;

  const baseClassName = `w-full ${Icon ? "pl-10" : "pl-3"} ${
    isPassword ? "pr-12" : "pr-3"
  } h-8 border-0 border-b border-(--color-transparent-neutral-30) bg-(--color-transparent-neutral-5) text-(--color-transparent-neutral-80) focus:outline-none focus:border-b-2 focus:border-(--color-baseline-100) transition-all font-medium text-sm leading-5 tracking-normal`;

  const finalClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80)">
          {label} {required && <Asterisk className="h-3 w-3 fill-(--color-error-main)" />}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 fill-(--color-transparent-neutral-60)" />
          </div>
        )}
        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={finalClassName}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors">
            {showPassword ? (
              <EyeOff className="h-4 w-4 fill-(--color-transparent-neutral-60)" />
            ) : (
              <Eye className="h-4 w-4 fill-(--color-transparent-neutral-60)" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
