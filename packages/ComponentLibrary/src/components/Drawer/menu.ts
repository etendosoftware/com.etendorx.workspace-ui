export interface Menu {
  title: string;
  singleRecord: boolean;
  readOnly: boolean;
  editOrDeleteOnly: boolean;
  type: Type;
  submenu: MenuSubmenu[];
  icon: string;
}

export interface MenuSubmenu {
  title: string;
  singleRecord: boolean;
  readOnly: boolean;
  editOrDeleteOnly: boolean;
  type: Type;
  submenu?: SubmenuSubmenu[];
  tabId?: string;
  windowId?: string;
  optionType?: OptionType;
  id?: string;
  viewValue?: string;
}

export enum OptionType {
  Process = 'process',
  ProcessDefinition = 'processDefinition',
  ProcessManual = 'processManual',
  Tab = 'tab',
  URL = 'url',
}

export interface SubmenuSubmenu {
  title: string;
  type: Type;
  tabId?: string;
  windowId?: string;
  optionType?: OptionType;
  id?: string;
  viewValue?: string;
  singleRecord: boolean;
  readOnly: boolean;
  editOrDeleteOnly: boolean;
  viewId?: string;
  uiPattern?: UIPattern;
  processId?: string;
  manualUrl?: string;
  formId?: string;
  tabTitle?: string;
  modal?: string;
  manualProcessId?: string;
  submenu?: SubmenuSubmenu[];
}

export enum Type {
  Folder = 'folder',
  Form = 'form',
  Process = 'process',
  ProcessDefinition = 'processDefinition',
  ProcessManual = 'processManual',
  Report = 'report',
  View = 'view',
  Window = 'window',
}

export enum UIPattern {
  A = 'A',
  OBUIAPPPickAndExecute = 'OBUIAPP_PickAndExecute',
  OBUIAPPReport = 'OBUIAPP_Report',
}
