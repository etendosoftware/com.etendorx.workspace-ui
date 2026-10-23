import type { Page } from "@playwright/test";
import { AttributeSelector } from "./AttributeSelector";
import { Auth } from "./Auth";
import { Breadcrumb } from "./Breadcrumb";
import { CreateLinesFrom } from "./CreateLinesFrom";
import { FormField } from "./FormField";
import { InstancePurpose } from "./InstancePurpose";
import { Grid } from "./Grid";
import { LegacyFrame } from "./LegacyFrame";
import { MatchStatement } from "./MatchStatement";
import { ProcessModal } from "./ProcessModal";
import { SavedViews } from "./SavedViews";
import { SelectorModal } from "./SelectorModal";
import { Sidebar } from "./Sidebar";
import { Tabs } from "./Tabs";
import { Toast } from "./Toast";
import { Toolbar } from "./Toolbar";
import { WindowTabs } from "./WindowTabs";

export { ATTRIBUTE, type AttributeKey } from "./AttributeSelector";
export { AUTH_TEST_IDS, type RoleSelection } from "./Auth";
export { MATCH_ROW_ACTION, type MatchRowAction } from "./MatchStatement";
export { PROCESS_MODAL_TEST_IDS } from "./ProcessModal";
export { SIDEBAR_TEST_IDS } from "./Sidebar";
export type { TabLevel } from "./level";

/**
 * The application as seen by a spec: one object per reusable UI piece, all bound to the page.
 * Specs combine these instead of writing selectors.
 */
export class App {
  readonly auth: Auth;
  readonly sidebar: Sidebar;
  readonly breadcrumb: Breadcrumb;
  readonly toolbar: Toolbar;
  readonly tabs: Tabs;
  readonly field: FormField;
  readonly grid: Grid;
  readonly toast: Toast;
  readonly processModal: ProcessModal;
  readonly legacy: LegacyFrame;
  readonly createLinesFrom: CreateLinesFrom;
  readonly attributeSelector: AttributeSelector;
  readonly windows: WindowTabs;
  readonly instancePurpose: InstancePurpose;
  readonly savedViews: SavedViews;
  readonly matchStatement: MatchStatement;

  constructor(readonly page: Page) {
    this.auth = new Auth(page);
    this.sidebar = new Sidebar(page);
    this.breadcrumb = new Breadcrumb(page);
    this.toolbar = new Toolbar(page);
    this.tabs = new Tabs(page);
    this.field = new FormField(page);
    this.grid = new Grid(page);
    this.toast = new Toast(page);
    this.processModal = new ProcessModal(page);
    this.legacy = new LegacyFrame(page);
    this.createLinesFrom = new CreateLinesFrom(page);
    this.attributeSelector = new AttributeSelector(page);
    this.windows = new WindowTabs(page);
    this.instancePurpose = new InstancePurpose(page);
    this.savedViews = new SavedViews(page);
    this.matchStatement = new MatchStatement(page);
  }

  /** Lookup (magnifying glass) of the field with the given AD_Field_ID. */
  selectorModal(fieldId: string): SelectorModal {
    return new SelectorModal(this.page, fieldId);
  }
}
