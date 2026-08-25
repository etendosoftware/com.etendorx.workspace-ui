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
│   ├── form-rendering/               # Feature: Form rendering
│   │   └── README.md
│   ├── form-keyboard-navigation/     # Feature: Tab order and focus in the form view
│   │   └── README.md                # Tab-sequence contract, initial focus, shortcuts
│   ├── data-grids/                   # Feature: Data grids
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