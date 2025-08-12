import type React from "react";
import clsx from "clsx";
import { cleanDefaultClasses } from "../../../../ComponentLibrary/src/utils/classUtil";

export type ButtonVariant = "filled" | "outlined";
export type ButtonSize = "large" | "small";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: React.ReactNode;
  className?: string;
}

const getButtonClasses = ({
  variant,
  size,
  disabled,
}: {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
}) => {
  const base = `
    inline-flex items-center justify-center font-medium rounded-full
    transition-colors duration-200 w-full
  `;

  const sizeClass = size === "small" ? "py-3 text-sm" : "h-10 px-4 text-base";

  const cursorClass = disabled ? "!cursor-default" : "!cursor-pointer";

  const styles: Record<ButtonVariant, (args: { disabled?: boolean }) => string> = {
    filled: ({ disabled }) =>
      clsx(
        "text-(--color-etendo-contrast-text)",
        disabled
          ? "bg-(--color-transparent-neutral-100) opacity-20"
          : ["bg-(--color-baseline-100)", "hover:bg-(--color-dynamic-main)", "hover:[&>span>svg]:fill-white"]
      ),
    outlined: ({ disabled }) =>
      clsx(
        "border",
        disabled
          ? "border-gray-200 text-(--color-transparent-neutral-700) opacity-60"
          : [
              "text-(--color-transparent-neutral-700)",
              "hover:text-(--color-etendo-contrast-text)",
              "border-(--color-transparent-neutral-20)",
              "hover:border-(--color-etendo-dark)",
              "hover:bg-(--color-etendo-dark)",
              "hover:[&>span>svg]:fill-white",
            ]
      ),
  };

  return clsx(base, sizeClass, cursorClass, styles[variant]({ disabled }));
};

const Button = ({
  variant = "filled",
  size = "small",
  startIcon,
  disabled = false,
  className = "",
  children,
  style,
  ...rest
}: ButtonProps) => {
  const classes = getButtonClasses({ variant, size, disabled });

  // Forzar el cursor mediante style como respaldo
  const buttonStyle = {
    ...style,
    cursor: disabled ? "not-allowed" : "pointer",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={cleanDefaultClasses(classes, className)}
      style={buttonStyle}
      {...rest}>
      <span className="mr-2 [&>svg]:w-4 [&>svg]:h-4">{startIcon}</span>
      <span>{children}</span>
    </button>
  );
};

export default Button;
