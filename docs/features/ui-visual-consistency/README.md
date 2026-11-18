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

Text that needs to read on the light lilac header or the footer uses `--ui-text-soft`, not
`--ui-text-muted` (3.2:1 on the header gradient).

### Primary actions use the accent

The filled `Button` and the confirm button of `BasicModal` (used by `ConfirmModal` and `StatusModal`)
use the accent (`--ui-accent` / `dynamicColor.main`) instead of black. Switches use the accent when
on and `baselineColor.neutral[50]` / `--color-baseline-50` when off, which keeps the off track above
3:1 on the card.

### Text that does not fit ends in an ellipsis

- Grid cells are flex boxes, where a bare text node cannot end in an ellipsis. Every cell value is
  rendered inside a span with `TRUNCATED_CELL_CLASSES` (`utils/tableColumns.tsx`), including the
  fallback of the color-tag wrapper in `useColumns` and the link buttons of reference columns.
- Text inputs reserve 44px on the right for the clear icon and use `text-ellipsis`.
- Home widget chips stay on one line and show the full name in their `title`.

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

### Menus, tooltips and panels

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

### Other layout details

- Header buttons, including the theme toggle, are 40px with the same 4px gap.
- Sidebar: "Recently Viewed" lines up with the menu entries; nested entries add 8px per level, also in
  search results; the keyboard highlight looks like a hovered entry, so only the open window looks
  selected.
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
| Modals | `utils/form/selectors/selectorColumns.tsx`, `ProcessModal/WindowReferenceGrid.tsx`, `ComponentLibrary/.../Modal/CustomModal.tsx` |
| Shell | `components/{layout,ThemeToggle}.tsx`, `HelpDrawer/HelpDrawer.tsx`, `Drawer/RecentlyViewed`, `ComponentLibrary/.../Drawer/MenuTitle` |
| Home | `screens/Home/widgets/{DashboardGrid,WidgetCard,CTABanner,AddWidgetDialog}.tsx`, `renderers/chipClasses.ts` |
