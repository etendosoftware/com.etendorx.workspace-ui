import { FieldType, type Column, type Field } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldReference } from '@/utils';
import Tag from '@workspaceui/componentlibrary/src/components/Tag';
import { InfoOutlined, Error } from '@mui/icons-material';
import { TranslateFunction } from '@/hooks/types';

export const parseColumns = (columns?: Field[], t?: TranslateFunction): Column[] => {
  const result: Column[] = [];

  try {
    if (!columns) return result;

    for (const column of columns) {
      if (column.showInGridView) {
        let columnType = '';

        if (column.column?.reference$_identifier) {
          columnType = column.column.reference$_identifier;
        }

        result.push({
          header: column.name ?? column.hqlName,
          id: column.name,
          columnName: column.hqlName,
          isMandatory: column.isMandatory,
          _identifier: column.name,
          column: {
            _identifier: columnType,
          },
          name: column.name,
          type: columnType,
          accessorFn: (v: Record<string, unknown>) => {
            const reference = getFieldReference(column.column?.reference);

            if (reference == FieldType.BOOLEAN) {
              const yesText = t ? t('common.trueText') : 'Yes';
              const noText = t ? t('common.falseText') : 'No';

              return v[column.hqlName] ? (
                <Tag type="success" icon={<InfoOutlined />} label={yesText} />
              ) : (
                <Tag type="error" icon={<Error />} label={noText} />
              );
            }

            return v[column.hqlName + '$_identifier'] ?? v[column.hqlName];
          },
        });
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return result;
};
