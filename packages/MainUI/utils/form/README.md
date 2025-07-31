# Entity Form Configuration

This directory contains configuration for special entity handling in forms.

## entityConfig.ts

Centralized configuration for entities that require special behaviors during form operations.

### Common use cases:

#### 1. Remove ID fields when creating records

Some entities like `UOM` don't allow sending the `id` field when creating new records:

```typescript
{
  entityName: 'UOM',
  removeIdOnCreate: true,
}
```

#### 2. Advanced configuration with custom fields

```typescript
{
  entityName: 'CustomEntity',
  removeIdOnCreate: true,
  customBehaviors: {
    NEW: {
      removeFields: ['temporaryField', 'calculatedField'],
      addFields: { 
        defaultStatus: 'DRAFT',
        createdBy: 'system' 
      }
    },
    EDIT: {
      removeFields: ['createdDate'],
      addFields: { 
        lastModified: new Date().toISOString() 
      }
    }
  }
}
```

### Available functions:

- `shouldRemoveIdFields(entityName, mode)` - Check if ID fields should be removed
- `getFieldsToRemove(entityName, mode)` - Get custom fields to remove
- `getFieldsToAdd(entityName, mode)` - Get custom fields to add

### Automatic usage:

The `useFormAction` hook automatically uses this configuration, no changes required in existing form code.

### Adding new configuration:

1. Edit `ENTITY_CONFIGURATIONS` in `entityConfig.ts`
2. Add your entity configuration
3. Forms will automatically apply the rules

```typescript
export const ENTITY_CONFIGURATIONS: EntityConfig[] = [
  {
    entityName: 'UOM',
    removeIdOnCreate: true,
  },
  {
    entityName: 'YourNewEntity',
    removeIdOnCreate: true,
    // more configurations...
  }
];
```