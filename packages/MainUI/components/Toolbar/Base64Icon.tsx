import { useState } from 'react';
import Image from 'next/image';
import { DefaultIcon } from './buttonConfigs';

const Base64Icon: React.FC<{
  src: string;
  alt?: string;
  size?: number;
  onError?: () => void;
  // Props para filter utilities
  filter?: string;
  hoverFilter?: string;
  className?: string;
  filterClass?: string;
  hoverFilterClass?: string;
}> = ({
  src,
  alt = 'icon',
  size = 16,
  onError,
  filter,
  hoverFilter,
  className = '',
  filterClass,
  hoverFilterClass,
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return <DefaultIcon />;
  }

  const baseClasses = `w-4 max-w-6 transition-all duration-200 ${className}`;
  const filterClasses = filterClass ? ` ${filterClass}` : '';
  const hoverClasses = hoverFilterClass ? ` hover:${hoverFilterClass}` : '';
  const finalClassName = `${baseClasses}${filterClasses}${hoverClasses}`;

  const baseStyle = {
    objectFit: 'contain' as const,
    display: 'block',
    ...(filter && { filter }),
  };

  const hoverStyle = hoverFilter
    ? ({
        '--hover-filter': hoverFilter,
      } as React.CSSProperties)
    : {};

  return (
    <Image
      src={src}
      alt={alt}
      onError={handleError}
      width={size}
      height={size}
      style={{
        ...baseStyle,
        ...hoverStyle,
      }}
      className={finalClassName}
      onMouseEnter={e => {
        if (hoverFilter && e.currentTarget) {
          e.currentTarget.style.filter = hoverFilter;
        }
      }}
      onMouseLeave={e => {
        if (filter && e.currentTarget) {
          e.currentTarget.style.filter = filter;
        }
      }}
    />
  );
};

export default Base64Icon;
