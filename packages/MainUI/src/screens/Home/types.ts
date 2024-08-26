export interface ContentProps {
  isFormView: boolean;
  selectedItem: Organization | null;
  isSidebarOpen: boolean;
  handleSave: () => void;
  handleCancel: () => void;
  mockOrganizations: Organization[];
  handleRowClick: (row: MRT_Row<{ [key: string]: any }>) => void;
  handleRowDoubleClick: (row: MRT_Row<{ [key: string]: any }>) => void;
}
