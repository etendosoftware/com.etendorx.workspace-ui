# Custom-component processes

Some Classic Defined Processes render a dialog that no amount of metadata can describe. The
`openDynamicForm` surface offers `TEXT`, `CHECK` and `LIST` fields with OK/Cancel — enough for a form,
not for a barcode-driven packing grid or a two-level provider/scope picker with icons and tooltips.

For those, a process may render its **own React component** instead of the standard parameter form.

## How a process opts in

Two things are required, and both must be present:

1. `em_etmeta_custom_component = 'Y'` on the process (`obuiapp_process`).
2. `em_etmeta_onload` returning an object whose `type` is registered in
   `packages/MainUI/components/ProcessModal/Custom/registry.ts`.

The flag is read declaratively by `usesCustomComponent` (`customComponentUtils.ts`), before any script
runs — a standard process must never have its `onLoad` evaluated in this reduced sandbox merely to be
classified.

> **The common failure.** With the flag unset, the schema is discarded and the modal falls through to
> its standard render: an **empty dialog**, with no console error and no server error. The same happens
> when the flag is set but `em_etmeta_onload` is empty, or returns a `type` nobody registered. If a
> custom-component process opens blank, check those two things first.

## Flow

```
ProcessDefinitionModal
  ├─ usesCustomComponent(processDefinition)      → reads em_etmeta_custom_component
  ├─ useWarehousePlugin(...)                     → evaluates em_etmeta_onload in a reduced sandbox
  │    └─ isRegisteredCustomSchema(result.type)  → unknown type ⇒ discarded, standard render
  └─ getCustomComponent(schema.type)             → renders that component
```

`useWarehousePlugin` keeps its historical name; despite it, it serves every custom-component process,
not only the warehouse ones.

## The onLoad sandbox

The `onLoad` of a custom-component process runs with a **reduced** context — not the full script
context that `onProcess` gets:

| Available | Notes |
|---|---|
| `callAction(actionHandler, params)` | POSTs to the kernel. Params are wrapped in `_params` unless you pass `_topLevel: true` |
| `fetchDatasource(entity, params)` | Entity lookups through `/api/datasource` |
| `OB` | The shim: `I18N`, `Format`, `PropertyStore`, … |
| `fetch` | **Explicitly `undefined`** — use `callAction` / `fetchDatasource` |

Signature: `(processDefinition, { selectedRecords }) => schema`. `selectedRecords` holds the full
records selected in the launching tab, not just their ids.

### Report failures inside the schema, not by throwing

`ProcessDefinitionModal` does not read the hook's `error` channel. An `onLoad` that throws therefore
produces the empty dialog described above. Return a well-formed schema carrying the failure instead,
and let the component render it:

```js
const base = { type: "middlewareTokenProcess", providers: {}, accountId: "" };
if (!record) return { ...base, errorCode: "noRecordSelected" };
```

### Report failures as codes, not as prose

An `errorCode` the component maps to a translation key survives translation; an English sentence built
in the `onLoad` or returned by a Java handler does not. Keep any English `message` beside the code as a
diagnostic for logs, and make the component fall back to a generic translated reason when it meets a
code it does not know — otherwise adding a code server-side renders a raw identifier to the user.

### `OB.User` is not populated here

The shim built for this sandbox is created without the session user, so `OB.User.id` is `""`. A
component can read the real id from `useUserStore` instead; a script in this sandbox cannot.

## Adding a new custom component

1. Create `Custom/<YourProcess>/` with the component, its `types.ts` (exporting a schema interface with
   a unique `type` literal), and `index.ts`.
2. Add the schema to the `CustomProcessSchema` union in `Custom/types.ts`.
3. Register it in `Custom/registry.ts`.
4. Accept `CustomProcessComponentProps`. Every custom component receives the same props; ignore the
   ones that do not apply (`payscriptPlugin` is only meaningful to the warehouse flow).
5. Put every user-facing string in **both** `packages/ComponentLibrary/src/locales/en.ts` and
   `es.ts`, and read them with `useTranslation`. Do not read them from `ad_message` via `getLabel`,
   and do not hardcode them: a label with no `ad_message` row renders as its raw key, which is
   exactly the bug the Get Middleware Token process inherited from Classic. Check whether the
   platform already has the wording (`process.popupBlocked`, `process.openLink`, …) before adding it.
6. Set `em_etmeta_custom_component = 'Y'` and write the `onLoad` — **in that order relative to
   deployment**: setting the flag before the component exists produces the empty dialog.

Nothing else changes. The registry lookup is the only dispatch point.

## Registered types

| `type` | Component | Used by |
|---|---|---|
| `warehouseProcess` | `GenericWarehouseProcess` | Packing, picking, and validate-picking-list |
| `middlewareTokenProcess` | `MiddlewareTokenProcess` | Get Middleware Token (`3B85498FECA646F19AD0E5D416C36776`) |

## Files

| File | Purpose |
|---|---|
| `Custom/registry.ts` | Schema `type` → component map, plus `getCustomComponent` / `isRegisteredCustomSchema` |
| `Custom/types.ts` | `CustomProcessSchema` union and `CustomProcessComponentProps` |
| `Custom/GenericWarehouseProcess/customComponentUtils.ts` | `usesCustomComponent` — reads the AD flag |
| `Custom/GenericWarehouseProcess/useWarehousePlugin.ts` | Evaluates `onLoad`, keeps the schema if its type is registered |
| `Custom/GenericWarehouseProcess/warehouseApiHelpers.ts` | `createCallAction` / `createFetchDatasource` used by the sandbox |

## See Also

- [onLoad / onProcess AD fields](./ad-fields-onload-onprocess.md)
- [Process Definition Modal](./process-definition-modal.md)
