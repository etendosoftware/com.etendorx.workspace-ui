import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

const BASE_STYLES = 'flex flex-col overflow-hidden min-h-0 m-2';
const EXPANDED_STYLES = 'flex-1';
const COLLAPSED_STYLES = '';
const MAIN_TAB_STYLES = '';
const SUB_TAB_STYLES = 'bg-white items-';

export type ContainerProps = React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & { collapsed: boolean; current: Tab }
>;

export function TabContainer({ className, collapsed, current, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      className={`${BASE_STYLES} ${current.tabLevel === 0 ? MAIN_TAB_STYLES : SUB_TAB_STYLES} ${collapsed ? COLLAPSED_STYLES : EXPANDED_STYLES} ${className}`}
    />
  );
}

export default TabContainer;
