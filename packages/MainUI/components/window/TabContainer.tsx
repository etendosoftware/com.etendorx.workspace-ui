import { useState, useCallback } from "react";
import type { Tab } from "@workspaceui/etendohookbinder/src/api/types";
import ResizeHandle from "../ResizeHandle";

const BASE_STYLES = "flex flex-col overflow-hidden min-h-0 m-2";
const COLLAPSED_STYLES = "";
const MAIN_TAB_STYLES = "";
const SUB_TAB_STYLES = "bg-white items-";

export type ContainerProps = React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & { 
    collapsed: boolean; 
    current: Tab;
    isTopExpanded?: boolean;
  }
>;

export function TabContainer({ 
  className, 
  collapsed, 
  current, 
  isTopExpanded = false,
  ...props 
}: ContainerProps) {
  const [customHeight, setCustomHeight] = useState(50);
  
  const handleHeightChange = useCallback((height: number) => {
    setCustomHeight(height);
  }, []);
  
  const getExpansionStyles = () => {
    if (collapsed) {
      return COLLAPSED_STYLES;
    }
    
    if (isTopExpanded) {
      return "flex-1";
    }
    
    return "";
  };

  const getCustomStyle = () => {
    if (!collapsed && !isTopExpanded) {
      return { height: `${customHeight}%` };
    }
    return {};
  };

  const showResizeHandle = !isTopExpanded && !collapsed;

  return (
    <>
      {showResizeHandle && (
        <ResizeHandle 
          onHeightChange={handleHeightChange}
          initialHeight={customHeight}
          minHeight={20}
          maxOffsetRem={9}
        />
      )}
      <div
        {...props}
        className={`${BASE_STYLES} ${current.tabLevel === 0 ? MAIN_TAB_STYLES : SUB_TAB_STYLES} ${getExpansionStyles()} ${className}`}
        style={{ ...props.style, ...getCustomStyle() }}
      />
    </>
  );
}

export default TabContainer;