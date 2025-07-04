import type { Tab } from "@workspaceui/api-client/src/api/types";

const BASE_STYLES = "flex flex-col overflow-hidden min-h-0 m-2 mt-0 rounded-xl";
const COLLAPSED_STYLES = "cursor-pointer";
const MAIN_TAB_STYLES = "";
const SUB_TAB_STYLES = "border border-(--color-transparent-neutral-10) ";

export type ContainerProps = React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & {
    collapsed: boolean;
    current: Tab;
    isTopExpanded?: boolean;
    customHeight?: number;
  }
>;

export function TabContainer({
  className,
  collapsed,
  current,
  isTopExpanded = false,
  customHeight,
  ...props
}: ContainerProps) {
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

  return (
    <>
      <div
        {...props}
        className={`${BASE_STYLES} ${current.tabLevel === 0 ? MAIN_TAB_STYLES : SUB_TAB_STYLES} ${getExpansionStyles()} ${className}`}
        style={{ ...props.style, ...getCustomStyle() }}
      />
    </>
  );
}

export default TabContainer;
