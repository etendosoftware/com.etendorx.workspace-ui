import type React from 'react';
import Tooltip from '../Tooltip';
import { cleanDefaultClasses } from '../../utils/classUtil';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  ariaLabel?: string;
  tooltip?: string;
  className?: string;
  iconText?: string;
  ref?: React.LegacyRef<HTMLButtonElement>;
}

const IconButton = ({
  className = '',
  children,
  disabled = false,
  ariaLabel,
  tooltip,
  iconText,
  ref,
  ...rest
}: IconButtonProps) => {
  const DEFAULT_BUTTON_CLASSES = `
  transition
  duration-300
  disabled:bg-transparent
  disabled:text-(--color-transparent-neutral-30)
  rounded-full
  text-(--color-baseline-80)
  hover:text-(--color-baseline-0)
  bg-(--color-baseline-0)
  hover:bg-(--color-dynamic-main)
  inline-flex
  items-center
  justify-center
  text-[0.825rem]
  min-w-max
  [&>svg]:text-[1.5rem]
  [&>svg]:fill-current
  ${iconText ? 'px-2 gap-2' : 'w-8 h-8'}
`;
  return (
    <Tooltip title={tooltip}>
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={cleanDefaultClasses(className, DEFAULT_BUTTON_CLASSES)}
        {...rest}>
        {children}
        {iconText && <span>{iconText}</span>}
      </button>
    </Tooltip>
  );
};

IconButton.displayName = 'IconButton';
export default IconButton;
