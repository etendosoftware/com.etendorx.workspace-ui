export interface TooltipProps {
  title?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ title, children, className, position = 'bottom' }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return {
          tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
          arrow: '-top-1 left-1/2 -translate-x-1/2 border-t-gray-900',
        };
      case 'left':
        return {
          tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
          arrow: 'top-1/2 -right-1 -translate-y-1/2 border-l-gray-900',
        };
      case 'right':
        return {
          tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
          arrow: 'top-1/2 -left-1 -translate-y-1/2 border-r-gray-900',
        };
      case 'top':
      default:
        return {
          tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          arrow: '-bottom-1 left-1/2 -translate-x-1/2 border-b-gray-900',
        };
    }
  };

  if (!title) return <>{children}</>;

  const { tooltip, arrow } = getPositionClasses();

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity delay-400  pointer-events-none ${className} ${tooltip}`}>
        <div className={`absolute w-2 h-2 rotate-45 ${arrow} bg-gray-900`} />
        <div className="bg-gray-900 text-white text-sm rounded px-1 py-1 shadow-md whitespace-nowrap">{title}</div>
      </div>
    </div>
  );
};

export default Tooltip;
