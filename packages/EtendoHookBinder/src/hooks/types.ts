export interface ReportColumn {
  header: string;
  accessorKey: string;
}

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: 'date' | 'select' | 'multiselect' | 'search' | 'string';
  required: boolean;
  gridWidth?: 1 | 2 | 3;
  entity?: string;
  columnName?: string;
  identifierField?: string;
  columns?: ReportColumn[];
  original?: {
    referencedEntity?: string;
    referencedWindowId?: string;
    referencedTabId?: string;
    column?: {
      callout$_identifier?: string;
    };
  };
  lookupConfig?: {
    url?: string;
    values?: Array<{ id: string; name: string }>;
    multiple?: boolean;
    selector?: {
      icon?: string;
      title?: string;
    };
  };
  validation?: {
    lowerThan?: string;
    greaterThan?: string;
  };
}

export interface ReportResponse {
  url?: string;
  blob?: Blob;
}

export interface ReportMetadata {
  id: string;
  title: string;
  sourcePath: string;
  sections: Array<{
    id: string;
    title: string;
    fields: ReportField[];
  }>;
  actions: Array<{
    id: string;
    name: string;
    format: string;
    command: string;
  }>;
}

export interface ReportMetadataHook {
  metadata: ReportMetadata | null;
  loading: boolean;
  error: string | null;
}
