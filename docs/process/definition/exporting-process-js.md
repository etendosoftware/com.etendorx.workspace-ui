# Exporting Process JavaScript to `com.etendoerp.metadata.template`

Use this procedure after changing the JavaScript stored for a Defined Process in the database (see
[new-javascript-code.md](./new-javascript-code.md)). Until it is exported, the change exists only in your local
database. Other environments receive it only through the `com.etendoerp.metadata.template` module.

## Where the JavaScript is delivered from

The scripts live in metadata columns added by `com.etendoerp.metadata`:

- `OBUIAPP_PROCESS`: `EM_ETMETA_ONLOAD`, `EM_ETMETA_ONPROCESS`, `EM_ETMETA_ON_REFRESH`,
  `EM_ETMETA_PAYSCRIPT_LOGIC`, `EM_ETMETA_CUSTOM_COMPONENT`;
- `OBUIAPP_PARAMETER`: `EM_ETMETA_ON_PARAMETER_CHANGE`, `EM_ETMETA_ON_GRID_LOAD`.

The process and parameter rows belong to other modules (core, APRM, …), so the values are delivered as
**configuration script changes** of `com.etendoerp.metadata.template`. They are `columnDataChange` entries in
`src-db/database/configScript.xml`, keyed by table, column and `pkRow`, and applied when the module is installed.

## Procedure

1. **Install the module from source.** It is usually installed as a JAR through the platform bundle
   (`com.etendoerp:platform.extensions` in the ERP `build.gradle`). Clone
   `com.etendoerp.metadata.template` into `modules/`, so the source version is used.
2. **Set it in development.** In *Module*, set `com.etendoerp.metadata.template` **In Development** (or
   `AD_MODULE.ISINDEVELOPMENT = 'Y'`).
3. **Change the JavaScript in the database.** Edit the `EM_ETMETA_*` column of the process or parameter.
4. **Export:** `./gradlew export.config.script --info` from the ERP root. This rewrites
   `modules/com.etendoerp.metadata.template/src-db/database/configScript.xml`.
5. **Review the diff entry by entry and keep only your change.** The export regenerates the whole file from
   **your local database** (see below), so the raw diff usually contains far more than your change.
6. **Commit** on the task branch of the `com.etendoerp.metadata.template` repository (a separate PR from the UI
   and backend changes). Then set the module back to not in development.

## Why the raw export deletes code

`export.config.script` writes one entry per configuration change found in the **current database**. The committed
file was produced in an environment with all the bundles supported by Etendo. A local environment usually has
only some of them installed, so:

- entries whose process, parameter or menu row **does not exist locally** come out as **deleted**, although
  they are valid for the other environments;
- `<versionInfo version="…"/>` takes the core version of the local environment.

**Never commit those deletions or the version change.** Commit only the entries of the rows you changed.

## Keeping only your change

- **Interactive:** `git add -p src-db/database/configScript.xml`, staging only your hunks, then
  `git checkout -- src-db/database/configScript.xml` to drop the rest.
- **Non-interactive (scripts, agents):** start from the committed file (`git show HEAD:…/configScript.xml`),
  replace only the `newValue` of your `columnDataChange` entries with the exported ones, and check the result
  with `git diff`. The diff must show only your lines.

To see which entries an export really changed, compare the files entry by entry instead of line by line. Line
diffs realign large unchanged blocks and look like edits. This snippet lists removed, added and changed entries:

```python
import re
ENTRY = r'<columnDataChange tablename="([^"]+)" columnname="([^"]+)" pkRow="([^"]+)">(.*?)</columnDataChange>'

def entries(path):
    text = open(path).read()
    return {(m[1], m[2], m[3]): m[4] for m in re.finditer(ENTRY, text, re.S)}

before, after = entries("configScript.before.xml"), entries("configScript.after.xml")
print("removed:", [k for k in before if k not in after])
print("added:", [k for k in after if k not in before])
print("changed:", [k for k in after if k in before and after[k] != before[k]])
```

A removed entry whose row does not exist in your database is one of the missing-bundle deletions described
above. Keep it.

## Example (ETP-5877)

Match Statement's `onGridLoad` (`OBUIAPP_PARAMETER` `4EDC18E376BB4EEB937AE1F1EF4EB8B1`) got two new lines. The
raw export also removed 92 entries (processes, parameters and menus of bundles not installed locally) and changed
`versionInfo`. The committed change is the two lines only.
