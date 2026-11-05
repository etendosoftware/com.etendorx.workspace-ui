# Application Forms (ETP-6011)

How the new UI opens the menu entries of type **Form**: classic Application Forms (`AD_FORM`), such
as *Generate Shipments (manual)* or *Settle / Protest Remittances*.

## Behavior

The new UI does not reimplement Application Forms. They open in a Classic popup, as other legacy
entries do:

1. The menu metadata (`/meta/menu`, built by `MenuBuilder`) gives each Form entry its `formId` and a
   `formUrl`. The `formUrl` is the address the form is served at.
2. The client loads `/meta/legacy/security/Menu.html?url=<formUrl>&noprefs=true&hideMenu=true&Command=DEFAULT&token=…`
   in a popup (`width=950,height=700`). The Classic `security/Menu` servlet frames
   `<context path> + <formUrl>`, the same way the Classic menu does.
3. When the browser blocks the popup, a notice offers to open it manually with the same URL.

Forms open the same way from every entry point:

| Entry point | How the form address is obtained |
|---|---|
| Drawer menu | The menu entry itself |
| Drawer "Recently viewed" | The live menu entry with the same id and type (`useRecentItems`) |
| Home "Recently Viewed" widget | The live menu entry with the same id and type (`findLiveMenuEntry`) |
| Favorites | Not applicable: only windows can be marked as favorites |

## Form address resolution

`MenuBuilder.resolveFormUrl` resolves `formUrl` like Classic:

1. **Default mapping.** Classic only marks a menu entry as `Form` when the form has a model
   implementation (`AD_MODEL_OBJECT`) with a default mapping (`AD_MODEL_OBJECT_MAPPING.ISDEFAULT = 'Y'`).
   Classic keeps the mapping name as the entry id (`GlobalMenu.linkMenus`) and opens it
   (`manualUrl` in `application-menu.js.ftl`). The new UI emits the same value.
2. **Fallback.** For any other entry, the address is derived from the Java class name, as
   `/ad_forms/<SimpleClassName>.html`. When the form has no class name, `formUrl` is not sent.

The client uses `formUrl` as is. The bundled `utils/processes/forms/data.json` is only a fallback for
backends that do not send `formUrl`.

### Why the default mapping

Core forms are mapped under `/ad_forms/`, so the derived address happened to work for them. Forms
provided by modules are mapped under their own package. For example, *Settle / Protest Remittances*
is mapped at `/org.openbravo.module.remittance.ad_forms/CancelReturnRemittance.html`. Deriving
`/ad_forms/CancelReturnRemittance.html` from the class name gave a 404 page. Reading the registered
mapping supports every form, from core or from any module, with no per-form configuration. It needs
no extra query either, because the mapping is already in the cached Classic menu tree.

## Configuration

None. A form only needs what Classic already requires: a model implementation with a default
mapping, and form access for the role.

The menu JSON is cached per role and language (`MENU_METADATA`). After a backend update, the menu
cache must be invalidated (it is cleared on Application Dictionary changes and on a full metadata
cache reset) or the server restarted, so the new `formUrl` is served.

## Differences with Classic

- The form opens in a popup window, not inside a Classic tab.
- From the Home "Recently Viewed" widget, process-like entries (Process Definition, Report and
  Process, Pick and Execute) still open as before. They need the process modal, which only the
  drawer menu hosts. Forms, ProcessManual, Report and View entries open as from the menu.

## Main files

| Layer | File |
|---|---|
| Form address (backend) | `com.etendoerp.metadata/src/com/etendoerp/metadata/builders/MenuBuilder.java` (`addFormInfo`, `resolveFormUrl`) |
| Backend tests | `com.etendoerp.metadata/src-test/src/com/etendoerp/metadata/builders/MenuBuilderTest.java` |
| Classic popup URLs and openers | `packages/MainUI/utils/menu/legacyMenuEntry.ts` |
| Classic entry opener hook | `packages/MainUI/hooks/useOpenLegacyMenuEntry.ts` |
| Drawer menu dispatch | `packages/MainUI/components/Sidebar.tsx` (`handleClick`) |
| Home widget | `packages/MainUI/screens/Home/widgets/renderers/RecentlyViewedRenderer.tsx` |
| Legacy fallback addresses | `packages/MainUI/utils/processes/forms/data.json` |

Related: [Recently viewed items](../recent-items/README.md).
