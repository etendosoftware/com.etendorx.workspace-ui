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

import type { Etendo } from "../api/metadata";
import { type Field, FieldType, type Tab } from "../api/types";

export const groupTabsByLevel = (windowData?: Etendo.WindowMetadata) => {
  const tabs: Etendo.Tab[][] = [];

  try {
    if (!windowData?.tabs) {
      return tabs;
    }

    for (const tab of windowData.tabs) {
      if (tabs[tab.tabLevel]) {
        tabs[tab.tabLevel].push(tab);
      } else {
        tabs[tab.tabLevel] = [tab];
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return tabs;
};

export const buildFormState = (
  fields: Tab["fields"],
  record: Record<string, unknown>,
  formState: Record<string, Record<string, never>>
) => {
  try {
    const result = Object.entries(fields).reduce(
      (state, [, field]) => {
        const inputName = field.inputName;

        if (inputName?.length) {
          state[inputName] = record[field.hqlName];
        } else {
          console.warn("Missing field input name for", JSON.stringify(field, null, 2));
        }

        return state;
      },
      {} as Record<string, unknown>
    );

    const auxiliaryInputValues = formState?.auxiliaryInputValues;

    if (auxiliaryInputValues) {
      for (const [inputName, { value }] of Object.entries(auxiliaryInputValues)) {
        result[inputName] = value;
      }
    }

    return result;
  } catch (e) {
    console.warn(e);

    return {};
  }
};

export const isEntityReference = (type: FieldType) => [FieldType.SELECT, FieldType.TABLEDIR].includes(type);

export const getFieldsByColumnName = (tab?: Tab) => {
  try {
    if (!tab) {
      return {};
    }

    return Object.entries(tab.fields).reduce(
      (acc, [, field]) => {
        acc[field.columnName] = field;

        return acc;
      },
      {} as Record<string, Field>
    );
  } catch (e) {
    console.warn(e);

    return {};
  }
};

export const getFieldsByInputName = (tab?: Tab) => {
  try {
    if (!tab) {
      return {};
    }

    return Object.entries(tab.fields).reduce(
      (acc, [, field]) => {
        acc[field.inputName] = field;

        return acc;
      },
      {} as Record<string, Field>
    );
  } catch (e) {
    console.warn(e);

    return {};
  }
};

export const getFieldsByHqlName = (tab?: Tab) => {
  try {
    if (!tab) {
      return {};
    }

    return Object.entries(tab.fields).reduce(
      (acc, [, field]) => {
        acc[field.hqlName] = field;

        return acc;
      },
      {} as Record<string, Field>
    );
  } catch (e) {
    console.warn(e);

    return {};
  }
};
