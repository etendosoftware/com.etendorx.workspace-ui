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
    transition-colors duration-200
  `;

  const sizeClass = size === "small" ? "py-3 text-sm" : "h-10 px-4 text-base";

  const styles: Record<ButtonVariant, (args: { disabled?: boolean }) => string> = {
    filled: ({ disabled }) =>
      clsx(
        "text-white",
        disabled
          ? "bg-(--color-transparent-neutral-100) opacity-20 cursor-not-allowed"
          : "bg-(--color-baseline-100) hover:bg-(--color-dynamic-main)"
      ),
    outlined: ({ disabled }) =>
      clsx(
        "border",
        disabled
          ? "border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
          : "bg-blue-600 text-white border-blue-600"
      ),
  };

  return clsx(base, sizeClass, styles[variant]({ disabled }));
};

const Button = ({
  variant = "filled",
  size = "small",
  startIcon,
  disabled = false,
  active = false,
  className = "",
  children,
  ...rest
}: ButtonProps) => {
  const classes = getButtonClasses({ variant, size, disabled, active });

  return (
    <button type="button" disabled={disabled} className={cleanDefaultClasses(classes, className)} {...rest}>
      <span className="mr-2 [&>svg]:w-4 [&>svg]:h-4">{startIcon}</span>
      <span>{children}</span>
    </button>
  );
};

export default Button;
