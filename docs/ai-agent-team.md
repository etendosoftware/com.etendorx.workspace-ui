<!--
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 *************************************************************************
-->

# AI Agent Team — etendo-new-ui-team

This document describes the autonomous AI development team configured for Etendo WorkspaceUI. The team is composed of seven specialized agents that cover the full development pipeline — from reading a Jira ticket to opening a draft PR — with no human intervention required except for explicit authorization gates.

## Overview

The team is triggered by a single command in Claude Code:

```
@compas-ui Quiero realizar la tarea ETP-XXXX
```

From that point, the pipeline runs autonomously: it reads the Jira issue, plans the implementation, writes code, reviews it, tests it, audits its security, generates E2E tests, and opens a draft PR — waiting for human approval only at the two gates where it matters: the Jira transition and the PR creation.

### When to use this team

- Implementing a new feature described in a Jira Story or Task
- Fixing a bug described in a Jira Bug issue
- The feature is **frontend-only** (no backend changes required)

### When NOT to use this team

- The task requires new or modified REST API endpoints
- The task requires database schema or Application Dictionary changes
- The task requires new server-side business logic or auth rules

If the team detects a backend requirement during analysis, it stops immediately and informs you before touching any code.

---

## How to trigger the team

Open Claude Code (VS Code extension, desktop app, or CLI) and type:

```
Quiero realizar la tarea ETP-XXXX
```

Replace `XXXX` with the Jira issue ID (e.g. `ETP-3644`).

The team coordinator (Compas) will:
1. Read the Jira issue
2. Ask if you want to transition it to **In Progress**
3. Run the full pipeline
4. Ask for explicit authorization before opening the PR

You will receive status updates at each stage. The only responses the team expects from you are:
- `"Sí"` / `"No"` for the Jira transition prompt
- `"Autorizado. Procede."` to authorize the PR creation

---

## Branch Strategy

| Issue type     | Branch name          | Base branch    | PR target      |
|----------------|----------------------|----------------|----------------|
| Story / Task   | `feature/ETP-XXXX`   | `epic/ETP-YYYY`| `epic/ETP-YYYY`|
| Bug            | `hotfix/ETP-XXXX`    | `main`         | `main`         |

`YYYY` is the ID of the parent epic linked in Jira (`parent.key` or `customfield_10014`). If no parent epic is found, the team flags it and waits for your instruction before continuing.

---

## Pipeline

```
Trigger: "Quiero realizar la tarea ETP-XXXX"
│
├─ [Compas] Read Jira issue → compute branch context
├─ [Compas] Ask: transition to In Progress?
│
├─ [Traza]  Analyze codebase + detect backend requirements
│           ↳ backend required? → STOP, inform user
│
├─ [Marco]  Implement feature on branch
│           ↳ pnpm apply:data-testid  (mandatory, separate commit)
│           ↳ pnpm format:fix         (mandatory, separate commit)
│           ↳ pnpm build              (must pass)
│           ↳ pnpm check              (must pass)
│
├─ [Crisol] Code review of branch diff
│           ↳ CHANGES REQUESTED → Marco fixes → repeat
│
├─ [Pixel]  ─┐ (parallel)
│            ├─ Write + run unit tests
│            │
├─ [Vigia] ─┘ Security audit
│           ↳ any failure → Marco fixes → restart from Crisol
│
├─ [Argos]  Generate Cypress E2E test (or skip if not needed)
│
├─ [Compas] Present PR summary, ask for human authorization
│           ↳ "Autorizado. Procede." required to continue
│
└─ [Compas] Open draft PR → ask: transition Jira to Done?
```

All PRs are created as **drafts** to allow manual validation before merging.

---

## Agents

### Compas — Coordinator

**Color:** blue  
**Role:** Orchestrates the entire pipeline. Reads Jira, computes branch context, dispatches agents in the correct order, manages re-review cycles, and is the only agent that interacts with GitHub and Jira.

Key behaviors:
- Never pushes or opens PRs without explicit `"Autorizado. Procede."` from a human
- Stops the pipeline immediately if Traza detects backend requirements
- Restarts from Crisol whenever Marco fixes issues raised by any agent
- PR titles are always ≤ 80 characters (truncates Jira summary if needed)
- Creates PRs as drafts (`gh pr create --draft`)

---

### Traza — Technical Planner

**Color:** orange  
**Role:** Reads the Jira issue and the codebase, detects backend requirements, and produces a structured technical plan for Marco.

Key behaviors:
- **Never writes code** — only produces plans
- Immediately flags backend requirements and halts the pipeline
- Explores `packages/MainUI/`, `packages/ComponentLibrary/`, and `packages/api-client/` before writing anything
- Classifies complexity as `trivial | standard | complex`
- Plan output format: Affected Files, Reuse Opportunities, New Components Needed, Approach phases, Edge Cases, Risks, Out of Scope

---

### Marco — Frontend Developer

**Color:** green  
**Role:** Implements the feature or fix following Traza's plan as a strict contract.

Key behaviors:
- Checks `packages/ComponentLibrary/` before creating any new component
- TypeScript strict: no `any`, no unused variables or imports, explicit return types on all signatures
- **Pre-PR cleanup is mandatory**, in this order:
  1. `pnpm apply:data-testid` — adds missing `data-testid` attributes; commit separately if changes
  2. `pnpm format:fix` — applies Biome formatting; commit separately if changes
  3. `pnpm build` — must pass with zero errors
  4. `pnpm check` — must pass with zero errors
- Commit subject line HARD LIMIT: **≤ 80 characters** (`"Feature ETP-XXXX: "` is 18 chars → max 62 chars for description)
- Never touches `packages/api-client/` internals, backend routes, or server logic
- Never writes tests — that is Pixel's job

Commit format:
```
Feature ETP-XXXX: <description max 62 chars>

Co-Authored-By: Marco <noreply@anthropic.com>
```

---

### Crisol — Code Reviewer

**Color:** purple  
**Role:** Reviews the branch diff before any PR is opened. Issues a verdict of `APPROVED` or `CHANGES REQUESTED`.

Key behaviors:
- Always reads the Jira issue before reading a single line of diff
- Distinguishes **BLOCKER** (blocks pipeline) from **SUGGESTION** / **NIT** (do not block)
- Reports all findings at once — never drip-feeds across messages
- Never modifies code

**BLOCKER conditions include:**
- `any` type used anywhere
- Unused variables or unused imports anywhere in changed files
- `@ts-ignore` without justification
- Direct API calls inside components instead of hooks
- Side effects outside `useEffect`
- Prop or context state mutated directly
- Hardcoded secrets or API keys
- `dangerouslySetInnerHTML` without sanitization
- Commit subject line > 80 characters
- Missing `data-testid` on interactive elements (pre-PR cleanup not run)
- Biome formatting violations visible in diff (pre-PR cleanup not run)
- Wrong branch name format

Diff comparison base: `main` for hotfixes, `epic/ETP-YYYY` for features.

---

### Pixel — Unit Test Engineer

**Color:** yellow  
**Role:** Writes, runs, and iterates Jest + React Testing Library unit tests until the full suite is green.

Key behaviors:
- **Never modifies source code** — reports source bugs as BLOCKERs to Compas
- Runs iteratively until all tests pass; never stops at first failure
- No unused variables or imports in test files
- Test coverage order: empty/null → error states → loading states → happy path → user interactions → conditional rendering
- Uses `screen` queries (`getByRole`, `getByText`, `findByRole`) over `getByTestId`
- Prefers `userEvent` over `fireEvent`
- Runs full `pnpm test:mainui` suite after completing file-level tests to confirm no regressions

---

### Vigia — Security Auditor

**Color:** red  
**Role:** Performs a frontend security review of the branch diff. Focuses on XSS vectors, auth guard coverage, sensitive data exposure, and API client misuse.

Key behaviors:
- Only reports what can be **demonstrated from the diff** — no theoretical risks
- **BLOCKED** (pipeline stops) only on Critical or High severity
- Medium and Low are reported as findings but do not block
- Never posts to GitHub

Severity reference:

| Severity | Example                                          |
|----------|--------------------------------------------------|
| Critical | Hardcoded API key in source code                 |
| High     | `dangerouslySetInnerHTML` with unsanitized input |
| High     | Auth guard missing on a new protected page       |
| Medium   | New npm package added (supply chain risk)        |
| Medium   | `console.log` with user PII                      |
| Low      | Missing frontend rate limit                      |

---

### Argos — Cypress E2E Test Generator

**Color:** gray  
**Role:** Determines whether a new Cypress E2E test is needed for the change, and generates it if so.

Key behaviors:
- **Always reads all existing tests** before deciding to generate — never duplicates coverage
- **Never executes tests** — generation only
- Skips generation for purely cosmetic changes or type/constant-only changes
- Uses only existing custom commands from `cypress-tests/support/commands.js`
- Files must be JavaScript (`.cy.js`), not TypeScript

Test file location: `cypress-tests/e2e/smoke/<CATEGORY>/<PREFIX><letter><Name>.cy.js`

Existing categories and prefixes:

| Folder            | Prefix |
|-------------------|--------|
| `00_Login/`       | LGN    |
| `01_Sales/`       | SAL    |
| `03_Procurement/` | PRO    |
| `04_Masterdata/`  | ADM    |
| `05_Financial/`   | FIN    |
| `06_filters/`     | FLT    |
| `07_LinkedItems/` | LNK    |

For a new feature category, create a new `NN_CategoryName/` folder with a new prefix.

---

## Quality Gates Summary

| Gate         | Agent   | Blocks pipeline if…                                  |
|--------------|---------|------------------------------------------------------|
| Backend check| Traza   | Backend changes required                             |
| Code review  | Crisol  | Any BLOCKER finding (see list above)                 |
| Unit tests   | Pixel   | Any test fails or source bug reported                |
| Security     | Vigia   | Critical or High severity finding                    |
| PR creation  | Compas  | Human has not responded "Autorizado. Procede."       |

---

## Configuration

Agent definitions are stored in `.claude/agents/` at the project root:

```
.claude/agents/
  compas-ui.md   — Coordinator
  traza-ui.md    — Technical Planner
  marco-ui.md    — Frontend Developer
  crisol-ui.md   — Code Reviewer
  pixel-ui.md    — Unit Test Engineer
  vigia-ui.md    — Security Auditor
  argos-ui.md    — Cypress E2E Test Generator
```

The team is also synchronized to Fyso under the team name `etendo-new-ui-team`. Team metadata is stored in `.fyso/team.json`.

To update an agent's behavior, edit the corresponding `.md` file. Changes to agent files should be re-synced to Fyso — the source of truth for local development is the `.claude/agents/` directory.

---

## Frequently Asked Questions

**Q: What if the Jira ticket has no parent epic?**  
Compas flags this and waits for your instruction before continuing. You can provide the base branch manually.

**Q: What if the team detects backend changes are needed?**  
The pipeline stops after Traza's analysis. Compas informs you of what backend work is required. The UI team cannot proceed autonomously — you will need to involve the backend team.

**Q: Can I resume a pipeline that was interrupted?**  
Yes. Tell Compas which stage was last completed (e.g. "Marco already finished, dispatch Crisol") and provide the branch name and base branch. Compas will continue from that point.

**Q: What if Crisol requests changes that I disagree with?**  
SUGGESTIONs and NITs do not block the pipeline. Only BLOCKERs do. If you believe a BLOCKER is wrong, discuss it with Compas — you can override by explicitly stating your decision and the reason.

**Q: Why are PRs created as drafts?**  
To allow manual validation (additional testing, stakeholder review, or deployment checks) before the branch is merged. Mark the PR as ready when you are satisfied.
