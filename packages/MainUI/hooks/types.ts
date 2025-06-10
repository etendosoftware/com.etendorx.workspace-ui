import type { Field, Tab } from "@workspaceui/etendohookbinder/src/api/types";
import type { TranslationKeys, Translations, NestedKeyOf } from "../../ComponentLibrary/src/locales/types";

export type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(key: K) => string;

export type { TranslationKeys, Translations };

export enum FieldName {
  INPUT_NAME = "inputName",
  HQL_NAME = "hqlName",
  COLUMN_NAME = "columnName",
}

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
}
