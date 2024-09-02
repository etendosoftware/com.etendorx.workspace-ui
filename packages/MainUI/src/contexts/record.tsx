import React from 'react';
import { Organization } from '../../../storybook/src/stories/Components/Table/types';

export interface RecordContextType {
  selectedRecord: Organization | null;
  setSelectedRecord: (record: Organization | null) => void;
  getFormattedRecord: (
    record: Organization | null,
  ) => { identifier: string; type: string } | null;
}

export const RecordContext = React.createContext<RecordContextType | undefined>(
  undefined,
);
