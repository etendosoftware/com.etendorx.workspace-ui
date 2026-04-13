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

import { Breadcrumbs } from "@mui/material";
import type { FC } from "react";
import { useStyle } from "../styles";
import type { BreadcrumbListProps } from "../types";
import BreadcrumbItem from "../BreadcrumbItem/index";

const BreadcrumbList: FC<BreadcrumbListProps> = ({ items, handleActionMenuOpen, handleHomeNavigation, separator }) => {
  const { sx } = useStyle();

  return (
    <Breadcrumbs separator={separator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
      {items.map((item, index) => (
        <BreadcrumbItem
          key={item.id}
          item={item}
          position={index}
          breadcrumbsSize={items.length}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
        />
      ))}
    </Breadcrumbs>
  );
};

export default BreadcrumbList;
