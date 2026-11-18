# UI Visual Consistency — Alignment, Contrast and Shared Styles (ETP-6287)

A visual pass over the new UI (login, home, sidebar, header menus, grid, form, child tabs, modals and
dark mode, at 1440 × 900 and 1280 × 720) found details that did not match the design or each other.
This page records the rules the fixes follow, so new components keep them. Layout of the screens and
behavior are unchanged.

Contrast follows WCAG AA: 4.5:1 for text, 3:1 for icons and control borders. Every value below was
checked in light and dark mode.

## Rules

### Colors come from theme tokens

A hard-coded hex value or Tailwind arbitrary color does not switch with the theme, and was the cause of
every dark-mode defect found (white text on a light lilac focused field, invisible select icons, the
pastel Copilot panel). Colors are tokens defined in `app/styles/global.css`, in `:root` and again in
the `html[data-theme="dark"]` block. Tokens added by this task:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ui-field-focus-bg` / `-fg` / `-border` | `#ece8f6` / `#2a1757` / `#2a1757` | `#2d2650` / `#c8bff4` / `#8b7bdc` | Focused or open form field |
| `--ui-banner-accent`, `--ui-banner-cta`, `--ui-banner-cta-hover` | same in both themes | — | "What's new" banner, whose surface is dark in both themes |
| `--ui-switch-off` | `#74777f` | `#8b8e9a` | Outline and thumb of an "off" switch (4.5:1 on the card) |

Text that needs to read on the light lilac header or the footer uses `--ui-text-soft`, not
`--ui-text-muted` (3.2:1 on the header gradient).

### Primary actions use the accent

The filled `Button` and the confirm button of `BasicModal` (used by `ConfirmModal` and `StatusModal`)
use the accent (`--ui-accent` / `dynamicColor.main`) instead of black.

Switches (form `Switch` and the `Toggle` of the columns panel) differ by fill, not only by the thumb
position: "on" is a track filled with the accent and a white thumb; "off" is an empty track with a grey
outline and a smaller grey thumb (`--ui-switch-off`). A filled bluish "off" track read as "on".

### Text that does not fit ends in an ellipsis

- Grid cells are flex boxes, where a bare text node cannot end in an ellipsis. Every cell value is
  rendered inside a span with `TRUNCATED_CELL_CLASSES` (`utils/tableColumns.tsx`), including the
  fallback of the color-tag wrapper in `useColumns` and the link buttons of reference columns.
- Text inputs reserve 44px on the right for the clear icon and use `text-ellipsis`.
- Home widget chips stay on one line and show the full name in their `title`.
- Home widget empty messages use `WIDGET_EMPTY_TEXT_CLASSES` (baseline-60, 4.5:1 on the card).
- Every home widget uses the same card surface (`WIDGET_CARD_THEME`) in both themes; a coloured icon of
  its type (`WidgetTypeIcon`, same icons and colours as the "Add widget" dialog) tells them apart.
  Coloured cards (near-black, then lilac favorites, yellow recent documents) blended with the page
  gradient or clashed with it.

### Numbers align to the right, header included

`utils/table/numericAlignment.ts` holds the shared header props (`align: "right"`, which MRT lays out
on the right) and the cell classes. They apply to numeric references (`isNumericReference`) in the
window grids, the selector modal and the pick-and-execute grids. Read-only numeric columns of a
process grid keep the formatted cell built by `useColumns`; a field that carries its reference only on
`field.reference` gets it copied to `column.reference` (`withColumnReference`).

### Form label column

Form fields and process parameters share `FieldLabelRow`: label, dotted leader and required mark.

- The label column takes 45% of a single column (it was a third, which left about five characters at
  1280px). A field spanning several columns keeps the same absolute label width.
- The required mark sits at the end of the column, in a slot that is kept empty for optional fields,
  so the asterisks of a column line up.
- The leader keeps a minimum width, so it never shrinks to a few stray dots or disappears.
- The mark is the same SVG asterisk in forms and process modals (accessible name `required`).

### Actions inside the input box

The record search magnifier of FK fields is shown inside the select box, after its clear icon, so the
field keeps the full width of its column. `FieldTrailingActionContext` lets the field offer the action
and the `Select` host it; the host registers before paint, and an input that cannot host it leaves the
action outside, as before. The Classic popup search of `LegacySelectorAffix` uses the same mechanism.
The action goes after the clear icon: that icon appears on hover, and a press must not move the
action between mouse down and mouse up.

### Toolbar icons

Four toolbar icons stored in `ETMETA_TOOLBAR_BUTTON` did not match the monochrome outline set: the
full-color Excel logo of Export to spreadsheet and the solid Advanced filters, Tab control and Show
table and form glyphs. `utils/toolbar/actionIcons.ts` replaces them, by action, with outline SVGs in
the same ink as the other database icons. They render through the same `<img class="icon-base64">`,
so hover, disabled and dark mode keep working through the existing global rules. Any other button,
including module buttons, keeps its database icon. Refresh no longer has a filled circle.

### Disabled filled buttons stay readable

New, Save Changes and Available Process were the accent faded to 20% when disabled (about 1.3:1). They
now turn into a neutral chip with soft text and a dark icon (`PRIMARY_DISABLED_CLASSES`,
`utils/toolbar/constants.ts`), above 6:1 in both themes.

### Option tiles keep their size

The tiles of Quick Setup (interface scale, favicon badge) keep a 1px border in both states; the selected
one adds an inset ring and the field focus surface (`--ui-field-focus-bg`), which is dark in dark mode,
so it does not look bigger and the colour swatches keep their contrast.

### Modals and panels are flat

Modals and panels use the flat card surface (`--ui-card-bg`) in both themes. The status and confirm
modals, the process result card and the Copilot panel had a tinted gradient (green, red, yellow,
pastel); the type of message is now shown by the round coloured icon of `StatusIconBadge` (a warning
badge in `ConfirmModal`) and by the coloured title of the process result.

The Copilot panel is anchored to the content area: from below the top bar to above the status bar, on
the 16px right margin.

### Menus, tooltips and panels

- Every round toolbar icon button carries `toolbar-icon-button` (`ToolbarSection`); a global rule turns
  its icon white on the dark hover fill, for every action, including Personalize Form, Tab control and
  module buttons. Refresh is transparent at rest but keeps the accent fill on hover.
- Tooltips hide when their trigger is pressed (`Tooltip`), so they never cover the menu or panel the
  button opens.
- `Menu` keeps a menu taller than the room next to its button attached to it and limits its height
  (`computeMenuVerticalPlacement`); it no longer jumps to the top of the screen over the header.
- Row, header and Save View menus share `utils/menuClasses.ts`: 13px text and separators that span
  the whole menu.
- The grid search box opens right under its toolbar row, aligned with its right edge
  (`computeSearchBoxPosition`), instead of a fixed place at the top right.
- The "Available Process" button sits beside the scrolling toolbar icons, so a narrow row does not cut
  it.
- Below 1440px the Help panel floats over the workspace instead of pushing it, which squeezed the
  header, toolbar and form at 1280px.

### Process grids look like the window grid

The grids of process modals (`WindowReferenceGrid`) use the styles of the window grid
(`components/Table/styles.ts`) through `ProcessModal/processGridStyles.ts`: two-band header (labels,
then filters), 32px rows, 13px text, column actions and sort icons shown on hover, empty filters at
rest and the selected row colour. Their filters were already the same components (`useColumns`).
Differences kept on purpose: the grid has a fixed height and a closed frame, because it stands alone in
the modal, and a small bar above it (selection count, add row, implicit filter, filters, columns,
fullscreen) in the toolbar button style, since a modal has no window toolbar. Summary functions and
grouping of the window grid are not offered there. The density toggle was removed: rows keep the
window grid height.

### Other layout details

- Header buttons, including the theme toggle, are 40px with the same 4px gap and 24px icons.
- Content starts 12px from the menu: windows have 8px of side padding plus the 4px inset of their toolbar
  and grid, the home page 12px. The back arrow of the top bar and the home button of the tab bar start on
  that same edge (`utils/workspaceEdge.ts`). It was 20px, which wasted width.
  The first child tab starts on the left edge of the child toolbar and grid (`SUB_TABS_BAR_PADDING`).
- Sidebar: "Recently Viewed" lines up with the menu entries; nested entries add 8px per level, also in
  search results; the keyboard highlight looks like a hovered entry, so only the open window looks
  selected.
- Home: the default layout comes from the SYSTEM rows of `ETMETA_DASHBOARD_WIDGET` in
  `com.etendoerp.metadata`, not from the client. It fills the four columns: Recently Viewed (1), Recent
  Documents (2, document identifiers are long), My Favorites (1), and Notifications across the second
  row, which is useful to any user and role.
- Home: widgets move left into columns left empty by hidden or unavailable widgets
  (`closeHorizontalGaps`, render only; positions are stored only when the user moves a widget).
- The status bar of the form wraps instead of hiding the fields past the right edge.
- The child tab panel starts at the same left edge as the parent grid and form.
- The login error hangs below the card, so the card does not move when it appears.

## Differences with Classic

None in behavior. Visual changes only.

## Not changed

- The inner title bar of Classic process popups is Classic HTML inside the iframe; only the new UI
  frame and its Close button were aligned.
- The capitalization of the password labels comes from the `UINAVBA_*Pwd` messages of the ERP
  (see [Profile Menu](../profile-menu/README.md)).
- Texts (profile tab names, breadcrumb, identifier format) are out of the scope of this page.

## Main files

| Area | Files |
|---|---|
| Tokens | `packages/MainUI/app/styles/global.css` |
| Primitives | `ComponentLibrary/src/components/{Tooltip,Menu,Button,BasicModal,Tag,Toggle,Input/Select}` |
| Grid | `hooks/table/useColumns.tsx`, `utils/tableColumns.tsx`, `utils/table/numericAlignment.ts`, `components/Table/{styles.ts,ActionsColumn.tsx}`, `utils/menuClasses.ts` |
| Toolbar | `utils/toolbar/actionIcons.ts`, `components/Toolbar/{TopToolbar,ToolbarSection,SearchPortal}` |
| Form | `selectors/components/FieldLabelRow.tsx`, `selectors/components/Select/FieldTrailingAction.tsx`, `selectors/{BaseSelector,GenericSelector}.tsx`, `FormView/StatusBar.tsx` |
| Modals | `utils/form/selectors/selectorColumns.tsx`, `ProcessModal/{WindowReferenceGrid.tsx,processGridStyles.ts}`, `ProcessModal/Custom/shared/ProcessModalShared.tsx`, `ComponentLibrary/.../{Modal/CustomModal.tsx,StatusModal}` |
| Shell | `components/{layout,ThemeToggle}.tsx`, `utils/workspaceEdge.ts`, `NavigationTabs/WindowTabs.tsx`, `window/SubTabsSwitch.tsx`, `ComponentLibrary/.../Copilot/CopilotPopup`, `HelpDrawer/HelpDrawer.tsx`, `Drawer/RecentlyViewed`, `ComponentLibrary/.../Drawer/MenuTitle` |
| Home | `screens/Home/widgets/{DashboardGrid,WidgetCard,CTABanner,AddWidgetDialog}.tsx`, `renderers/chipClasses.ts` |
