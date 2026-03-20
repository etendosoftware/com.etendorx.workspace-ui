# Claude Code Setup — Etendo WorkspaceUI

This directory contains shared Claude Code configuration for the team: skills, commands, agents, and hooks.

## Quick Start

1. Install [Claude Code](https://claude.ai/code)
2. Open this repo in Claude Code — shared skills and hooks activate automatically
3. Install the recommended plugins (see below) for extra capabilities

---

## What's Included (No Install Required)

These tools work out of the box once you open the repo in Claude Code.

### Superpowers Skills

Workflow skills that guide Claude through structured development processes. Claude invokes these automatically when relevant, or you can reference them explicitly.

| Skill | When Claude uses it |
|-------|-------------------|
| `superpowers:brainstorming` | Before any new feature or creative work — explores intent before writing code |
| `superpowers:test-driven-development` | When implementing features or bugfixes — writes tests first |
| `superpowers:systematic-debugging` | When encountering bugs or test failures |
| `superpowers:writing-plans` | When you give multi-step requirements — creates a structured plan |
| `superpowers:executing-plans` | When following a written plan — tracks progress atomically |
| `superpowers:verification-before-completion` | Before claiming work is done — verifies it actually works |
| `superpowers:requesting-code-review` | After completing a feature — prepares a proper code review |
| `superpowers:receiving-code-review` | When review feedback arrives — processes it systematically |
| `superpowers:finishing-a-development-branch` | When implementation is complete — final checks before merge |
| `superpowers:dispatching-parallel-agents` | When 2+ independent tasks can run in parallel |
| `superpowers:subagent-driven-development` | For executing plans with isolated parallel agents |
| `superpowers:using-git-worktrees` | When feature work needs isolation from main |
| `superpowers:using-superpowers` | Session startup — establishes how Claude uses skills |
| `superpowers:writing-skills` | When creating new custom skills for the team |

### Ralph Loop Commands

Iterative development technique: the same prompt is fed to Claude repeatedly, each iteration seeing its own previous work in files and git history.

```
/ralph-loop "Fix the auth flow" --max-iterations 10 --completion-promise "ALL TESTS PASS"
/cancel-ralph
/ralph-loop help
```

**When to use**: Well-defined tasks with clear success criteria that benefit from self-correction (refactors, test fixes, greenfield features).

**When NOT to use**: Tasks requiring design decisions, unclear success criteria, one-shot operations.

### GSD (Get Shit Done) Commands

Project planning and execution workflow.

```
/gsd:progress          # Check current project status
/gsd:plan-phase        # Plan the next phase in detail
/gsd:execute-phase     # Execute a planned phase
/gsd:debug             # Systematic debugging with persistent state
/gsd:help              # Full command reference
```

---

## Recommended Plugins (Install Separately)

These plugins require installation on each developer's machine. They add capabilities that can't be bundled into the repo.

### Install All at Once

```bash
# Install all recommended plugins
claude plugin install superpowers
claude plugin install ralph-loop
claude plugin install typescript-lsp
claude plugin install playwright
```

### Plugin Details

**`superpowers`** — The skills bundled in this repo come from this plugin. Installing it also enables visual brainstorming and spec document review. The repo-bundled version works standalone, but installing the plugin keeps you on the latest version.

**`ralph-loop`** — Required for `/ralph-loop` to work. The command and script are bundled in this repo, but the Stop hook (which intercepts session exit to continue the loop) only activates when the plugin is installed.

**`typescript-lsp`** — TypeScript/JavaScript language intelligence: go-to-definition, find-references, real-time error checking. Requires the language server globally:
```bash
npm install -g typescript-language-server typescript
```

**`playwright`** — Browser automation for testing UI flows directly from Claude Code sessions.

---

## Hooks

This repo runs automated hooks on tool use. They handle:
- Session state save/restore
- Pre/post edit coordination
- Learning pattern tracking

Hooks are configured in `settings.json` and implemented in `helpers/hook-handler.cjs`.

---

## Files You Should NOT Commit

These are auto-added to `.gitignore`:

- `.claude/settings.local.json` — your personal permission overrides (may contain local tokens)
- `.claude/memory/` — your personal AI memory for this project
- `.claude/.ralph-loop.local.md` — runtime state for active Ralph loops
