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

import { Breadcrumbs, Button } from "@mui/material";
import { type FC, useRef } from "react";
import { useStyle } from "../styles";
import type { BreadcrumbListProps } from "../types";
import { useBreadcrumbOverflow } from "../useBreadcrumbOverflow";
import BreadcrumbItem from "../BreadcrumbItem/index";

const BreadcrumbList: FC<BreadcrumbListProps> = ({
  items,
  handleActionMenuOpen,
  handleHomeNavigation,
  onCollapseMenuOpen,
  onBackClick,
  separator,
}) => {
  const { sx } = useStyle();
  const containerRef = useRef<HTMLElement | null>(null);
  const { visibleItemsWithIndex, collapsedItems, isCollapsed } = useBreadcrumbOverflow({
    containerRef,
    items,
  });

  if (visibleItemsWithIndex.length === 0) {
    return null;
  }

  const [firstEntry, ...restEntries] = visibleItemsWithIndex;

  return (
    <Breadcrumbs ref={containerRef} separator={separator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
      {/* First item is always visible */}
      <BreadcrumbItem
        key={firstEntry.item.id}
        item={firstEntry.item}
        position={firstEntry.originalIndex}
        breadcrumbsSize={items.length}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
        onBackClick={onBackClick}
      />

      {/* Ellipsis button as a standalone breadcrumb entry when collapsed */}
      {isCollapsed && (
        <Button
          key="collapse-button"
          sx={sx.collapseButton}
          onClick={(e) => onCollapseMenuOpen?.(e, collapsedItems)}
          aria-label="Show hidden breadcrumb items">
          ...
        </Button>
      )}

      {/* Middle and last visible items */}
      {restEntries.map(({ item, originalIndex }) => (
        <BreadcrumbItem
          key={item.id}
          item={item}
          position={originalIndex}
          breadcrumbsSize={items.length}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
          onBackClick={onBackClick}
        />
      ))}
    </Breadcrumbs>
  );
};

export default BreadcrumbList;
