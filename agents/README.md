# `client/agents/`

Version-controlled Claude Code **subagent definitions** for the Defined-Process JavaScript migration
workflow. These files are the source of truth; Claude Code does **not** load agents from here.

## How to use an agent

Copy the agent file into a directory Claude Code reads:

```bash
cp client/agents/babel.md .claude/agents/        # repo-root agents
# or
cp client/agents/babel.md client/.claude/agents/ # client-scoped agents
```

Once copied, the subagent (e.g. `babel`) becomes available.

## Agents

### `babel.md` — Defined-Process JS migrator

Migrates a classic Etendo Defined-Process `.js` file into the new-UI metadata columns
(`em_etmeta_*`). It reads the architecture/playbook doc
[`../docs/process/definition/new-javascript-code.md`](../docs/process/definition/new-javascript-code.md)
and the inventory [`../docs/process/definition/process-definition-js-testing.md`](../docs/process/definition/process-definition-js-testing.md),
decides feasibility, generates the per-column code for you to paste manually, lists the manual tests to
run, updates the inventory status, and persists a report under `client/agents/reports/<process-id>.md`.

**Activation template** (the agent acts only on this exact shape):

```
Quiero migrar el javascript del proceso definido. El path del archivo original es '<path>' y el id del proceso es '<process-id>'.
```

The agent performs **no** Git/PR actions and **never** writes to the database (it reads `etendodev`
read-only for reference). You paste the generated code into the UI yourself.

## `reports/`

Created on first run; holds one migration report per process (`<process-id>.md`).
