/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Tab } from "@workspaceui/api-client/src/api/types";

const BASE_STYLES = "flex flex-col overflow-hidden min-h-0 m-0 mb-2 rounded-xl";
const COLLAPSED_STYLES = "cursor-pointer";
const MAIN_TAB_STYLES = "";
const SUB_TAB_STYLES = "border border-(--color-transparent-neutral-10) flex flex-col gap-2";

export type ContainerProps = React.PropsWithChildren<
  React.HTMLProps<HTMLDivElement> & {
    collapsed: boolean;
    current: Tab;
    isTopExpanded?: boolean;
    customHeight?: number;
  }
>;

export function TabContainer({
  className = "",
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
    <div
      {...props}
      className={`${BASE_STYLES} ${current.tabLevel === 0 ? MAIN_TAB_STYLES : SUB_TAB_STYLES} ${getExpansionStyles()} ${className}`}
      style={{ ...props.style, ...getCustomStyle() }}
    />
  );
}

export default TabContainer;
