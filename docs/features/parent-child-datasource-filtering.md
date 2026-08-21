# Parent–child datasource filtering

How a child tab's grid asks the server for "the rows belonging to the record selected in my
parent tab". Two independent mechanisms cooperate, and a tab may rely on either or both.

## 1. The link column (a criteria on a foreign key)

Most child tabs have a real FK to the parent table, so the fetch carries an explicit criteria:

```json
{ "fieldName": "salesOrder", "operator": "equals", "value": "<parent record id>" }
```

**Which property is the link is decided by the backend, not guessed by the client.**
`com.etendoerp.metadata`'s `TabBuilder` publishes it as `tab.parentProperty`, computed with
`ApplicationUtils.getParentProperty(tab, parentTab)` — the very function the classic UI uses
(`OBViewGridComponent.getParentPropertyName`).

> **An empty `parentProperty` is a real answer, not a missing value.** It means the child table
> has no link column to that parent, and the grid must **not** invent one. `buildBaseCriteria`
> maps it to a `_dummy` criteria, exactly what classic's `OBViewGrid` sends for such tabs.

Do not derive the link from `tab.parentColumns`. That array lists *every*
`isLinkToParentColumn` of the table when no parent property exists, so picking its first entry
yields an unrelated column. Concrete case: **Sii Monitor › Issued Invoices** is a child of
`aeatsii_config` but its table is `C_Invoice`, whose only link-to-parent column is
`C_BPartner_ID`. Filtering by `businessPartner = <aeatsii_config id>` matches nothing.
`parentColumns` stays as it is because `useFormParent` needs it to seed FK values on new records.

`resolveParentFieldName` ([criteriaUtils.ts](../../packages/MainUI/utils/criteriaUtils.ts)) prefers
`tab.parentProperty` whenever the backend sends it and keeps its previous heuristic as a fallback
for older metadata backends.

## 2. The tab's `hqlwhereclause` (server-side, via `@…@` context variables)

Tabs with no link column — and many that have one — are filtered by `AD_Tab.hqlwhereclause`,
which the server applies from the `tabId` parameter alone
(`BaseDataSourceService.getWhereAndFilterClause`). Its `@…@` variables are resolved by
`AdvancedQueryBuilder.substituteContextParameters`, which walks the **ancestor tabs** and reads
them back out of the **request parameters**:

| Variable in the where clause | Resolved from the request param |
|---|---|
| `@<parenttable>_id@` | `@<ParentEntity>.id@` |
| `@AD_Org_ID@` | `@<ParentEntity>.organization@` |
| `@AD_Client_ID@` | `@<ParentEntity>.client@` |

Classic sends these with every child fetch — they are the parent record's *session properties*
(`getContextInfo(true, false)`, `ob-view-grid.js`). The new UI produces them in two places:

- [`buildEtendoContext`](../../packages/MainUI/utils/contextUtils.ts) — the general form, derived
  from each ancestor tab's field metadata (`hqlName === "id" || column.storedInSession`);
- [`buildParentSessionContext`](../../packages/MainUI/utils/contextUtils.ts) — the immediate
  parent's `id` / `client` / `organization`, emitted from the selected parent record in
  `useTableData`.

> **A missing `@<ParentEntity>.organization@` silently returns zero rows.** The variable falls
> back to the classic session and, if that is empty, `AD_ISORGINCLUDED(org, '', client)` evaluates
> to `-1` — so a where clause of the usual shape
> `(e.organization.id = @AD_Org_ID@ or AD_ISORGINCLUDED(e.organization.id, @AD_Org_ID@, e.client.id) <> -1)`
> excludes everything. There is no error, just an empty grid.

## Debugging an empty child grid

1. Compare the request body against the classic request for the same tab.
2. Check `criteria`: a `_dummy` entry means "filtered by the where clause"; a criteria on a field
   that has nothing to do with the parent means `parentProperty` was not honoured.
3. Check that `@<ParentEntity>.id@`, `.client@` and `.organization@` are present when the tab has
   an `hqlwhereclause` (`select hqlwhereclause from ad_tab where ad_tab_id = '…'`). If one is
   missing, look at the parent record in the graph: `buildEtendoContext` only emits a property the
   selected record actually carries and whose field is marked `column.storedInSession`.
