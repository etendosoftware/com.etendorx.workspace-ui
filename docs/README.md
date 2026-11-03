# WorkspaceUI Technical Documentation

This folder contains detailed technical documentation about WorkspaceUI features and architecture.

## 📁 Documentation Structure

```
docs/
├── README.md                          # This file - main index
├── architecture/                      # Architecture documentation
│   ├── overview.md                   # System overview
│   ├── data-flow.md                  # Data flow patterns
│   └── integration-patterns.md      # Integration patterns
├── features/                         # Feature documentation
│   ├── process-execution/            # Feature: Process execution
│   │   ├── README.md                # Feature overview
│   │   ├── process-definition-modal.md
│   │   ├── defaults-action-handler.md
│   │   └── window-references.md
│   ├── process-scripts/              # Feature: Dynamic process scripts (onLoad / onProcess / PayScript)
│   │   └── preferences.md           # Reading ERP preferences in scripts
│   │   (export of stored process JS: ../process/definition/exporting-process-js.md)
│   ├── form-rendering/               # Feature: Form rendering
│   │   └── README.md
│   ├── form-validation.md            # Feature: Required-field validation and revealing missing fields
│   ├── form-keyboard-navigation/     # Feature: Tab order and focus in the form view
│   │   └── README.md                # Tab-sequence contract, initial focus, shortcuts
│   ├── keyboard-shortcuts/           # Feature: Classic keyboard shortcuts (OBUIAPP_KeyboardShortcuts)
│   │   └── README.md                # Grammar, preference source, shortcut map per surface
│   ├── login-logout/                 # Feature: Clean session start after logout, Classic default role
│   │   └── README.md                # resetSessionState, token revocation, /meta/login-defaults
│   ├── match-statement/              # Feature: Match Statement process (Classic parity)
│   │   └── README.md                # Classic analysis, Confirm dialog, request params, context
│   ├── menu-search-keyboard-navigation/ # Feature: Keyboard navigation of the drawer menu
│   │   └── README.md                # Arrow/Enter/Escape contract, navigability rule
│   ├── recent-items/                 # Feature: Recently viewed items (drawer + Home widget)
│   │   └── README.md                # AD_Preference storage, size limit vs UINAVBA_RecentListSize
│   ├── saved-views/                  # Feature: Saved views and per-user grid configuration
│   │   └── README.md                # Widths, pinning, window layout, ETMETA_GridConfiguration
│   ├── dashboard-widget-refresh/     # Feature: Manual refresh of dashboard widgets
│   │   └── README.md                # Refresh button, loading state, auto-refresh interplay
│   ├── dashboard-widget-collapse/    # Feature: Collapse/expand dashboard widgets
│   │   └── README.md                # Header-only cards, half-row grid, ISCOLLAPSED persistence
│   ├── data-grids/                   # Feature: Data grids
│   │   └── README.md
│   ├── tab-display-logic/            # Feature: Child tab visibility (display logic, live header values)
│   │   └── README.md
│   └── table-state-persistence/      # Feature: Table state persistence
│       └── README.md                # Multi-window table state management
├── api/                              # API documentation
│   ├── metadata-client.md
│   ├── kernel-servlet.md
│   └── datasource-servlet.md
├── contexts/                         # Context documentation
│   ├── user-context.md             # User authentication and session
│   └── table-state-persistence.md  # Table state persistence context
├── testing/                          # Testing strategy
│   ├── session-sync-test-strategy.md
│   └── playwright-e2e/               # Playwright E2E suite: behavior, decisions, CI checks, feature probes, mocked backend
│       └── README.md
├── patterns/                         # Patterns and conventions
│   ├── react-patterns.md           # React patterns including state persistence
│   ├── state-management.md
│   └── error-handling.md
└── troubleshooting/                  # Troubleshooting guides
    ├── common-issues.md
    └── debugging-guide.md
```

## 🎯 **How to Use This Documentation**

### For New Developers
1. Read `architecture/overview.md`
2. Review `patterns/react-patterns.md`
3. Explore specific features in `features/`

### For Existing Features
- Look in `features/[feature-name]/`
- Check `api/` for integrations
- Review `troubleshooting/` for issues

### For New Features
1. Create folder in `features/[new-feature]/`
2. Document architecture and decisions
3. Include usage examples and testing

## 📝 **Documentation Standards**

- **Markdown** for all content
- **Diagrams** using Mermaid when possible
- **Code examples** with syntax highlighting
- **Internal links** between related documents
- **Update dates** in each document
- **English language** for all technical documentation

## 🔄 **Maintenance**

- Update docs alongside code changes
- Review docs in PRs when they affect documented features
- Remove/update docs for deprecated features