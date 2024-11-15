export const BREADCRUMB = {
  HOME: {
    ICON: '🏠',
    TEXT: 'Home',
  },
  NEW_RECORD: {
    ID: 'new-record',
    LABEL: 'Creating a new Record',
  },
  LOADING: {
    LABEL: 'Loading...',
  },
} as const;

export type BreadcrumbKeys = keyof typeof BREADCRUMB;
export type BreadcrumbValues = (typeof BREADCRUMB)[BreadcrumbKeys];
