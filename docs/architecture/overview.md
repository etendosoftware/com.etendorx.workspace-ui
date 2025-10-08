# WorkspaceUI Architecture Overview

## System Architecture

WorkspaceUI es una aplicación React/Next.js que sirve como interfaz principal para Etendo ERP.

### High-Level Architecture

```mermaid
flowchart TB
    UI[WorkspaceUI - Next.js]
    API[API Client Library]
    Backend[Etendo Classic Backend]
    
    UI --> API
    API --> Backend
    
    subgraph UI
        Components[React Components]
        Hooks[Custom Hooks]
        Contexts[React Contexts]
        Utils[Utility Functions]
    end
    
    subgraph API
        Metadata[Metadata Client]
        Kernel[Kernel Client]
        Datasource[Datasource Client]
    end
    
    subgraph Backend
        Servlet[Kernel Servlet]
        MetaAPI[Metadata API]
        DataAPI[Datasource API]
    end
```

## Key Components

### Frontend Layer
- **Next.js App Router**: Routing y SSR
- **React Components**: UI components reutilizables
- **Material-UI**: Design system base
- **React Hook Form**: Form management
- **TypeScript**: Type safety
- **Custom JavaScript Evaluation**: Secure dynamic code execution in table cells
- **Table State Persistence**: Global state management for table configurations across windows

### Integration Layer  
- **API Client**: Backend communication abstraction
- **Metadata Client**: Window/tab metadata retrieval
- **Kernel Client**: Process and action execution
- **Datasource Client**: Entity data retrieval
- **Custom JS Engine**: Sandboxed JavaScript evaluation for column customization

### Backend Integration
- **Etendo Classic**: ERP backend with Java servlets
- **Metadata API**: UI and process definitions
- **Kernel Servlet**: Process and action execution
- **Datasource Servlet**: Data queries

## Multi-Window State Management

WorkspaceUI implements a sophisticated multi-window system with persistent table state management:

### Table State Persistence Architecture

```mermaid
flowchart TB
    subgraph "Application Root"
        Provider[TableStatePersistenceProvider]
        GlobalState[Global State Store]
    end
    
    subgraph "Window A"
        TabA1[Tab A1 - Orders]
        TabA2[Tab A2 - Customers]
    end
    
    subgraph "Window B"
        TabB1[Tab B1 - Products]
        TabB2[Tab B2 - Inventory]
    end
    
    Provider --> GlobalState
    TabA1 --> HookA1[useTableStatePersistenceTab]
    TabA2 --> HookA2[useTableStatePersistenceTab]
    TabB1 --> HookB1[useTableStatePersistenceTab]
    TabB2 --> HookB2[useTableStatePersistenceTab]
    
    HookA1 --> GlobalState
    HookA2 --> GlobalState
    HookB1 --> GlobalState
    HookB2 --> GlobalState
    
    GlobalState --> StateStructure["{windowA: {tabA1: {filters, visibility, sorting, order}}}"]
```

### Key Features
- **Cross-Window Persistence**: Table configurations persist when switching between windows
- **Tab Isolation**: Each tab maintains independent table state within its window
- **Memory Management**: Automatic cleanup when windows are closed
- **Backward Compatibility**: Drop-in replacement for existing TabContext table state

### State Structure
```typescript
{
  windowId: {
    tabId: {
      table: {
        filters: MRT_ColumnFiltersState,
        visibility: MRT_VisibilityState,
        sorting: MRT_SortingState,
        order: string[]
      }
    }
  }
}
```

## Data Flow Patterns

See [data-flow.md](./data-flow.md) for complete details.

## Integration Patterns

See [integration-patterns.md](./integration-patterns.md) for integration patterns.