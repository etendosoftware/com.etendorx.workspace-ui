# Table Selection Session Sync - User Guide

## What is Table Selection Session Sync?

Table selection session synchronization automatically maintains your record selection context across different parts of the Etendo WorkspaceUI application. When you select records in any data table, the system instantly updates the server session to reflect your current selection.

This feature ensures that your selections persist and are available for related operations throughout your workflow.

## Key Benefits

### 🔄 Seamless Navigation
Your record selections persist when moving between different screens, tabs, or windows within the application. No need to re-select records when navigating back to a table.

### ⚡ Process Integration
Selected records are automatically available for batch operations, reports, and processes. The system knows which records you're working with without additional configuration.

### 🚀 Performance Optimized
Efficient synchronization that happens in the background without impacting table responsiveness or user interface performance.

### 🛡️ Reliable Operation
Robust error handling ensures that if synchronization temporarily fails, your table functionality continues to work normally.

## How It Works

### Automatic Operation
The session synchronization works automatically whenever you:
- Select individual records using checkboxes
- Select multiple records using Ctrl+Click or Shift+Click
- Use "Select All" functionality
- Clear selections

### Behind the Scenes
1. **Selection Detection**: The system detects when you change your record selection
2. **Smart Sync**: After a brief delay (to handle rapid selections), the system updates the server
3. **Session Update**: Your browser session is updated with the new selection context
4. **Ready for Use**: Selected records are now available for any related operations

## User Experience

### Visual Feedback
- ✅ Selected records remain highlighted in the table
- 🔄 No loading indicators for normal selections (happens instantly in background)
- ⚠️ For very large selections (100+ records), you may see a brief "Syncing..." indicator

### What You'll Notice
- **Faster Workflows**: No need to re-select records when switching between related screens
- **Consistent Behavior**: Selections work the same way across all tables in the application
- **Reliable Operation**: If internet connectivity is temporarily interrupted, tables continue to work normally

### What You Won't Notice
- **Background Processing**: Synchronization happens automatically without disrupting your work
- **Performance Impact**: No noticeable slowdown in table operations
- **Technical Details**: The system handles all the complexity behind the scenes

## Common Use Cases

### 1. Multi-Step Processes
**Scenario**: You need to select several sales orders and then generate reports

1. Navigate to Sales Orders table
2. Select the orders you want (✅ automatically synced)
3. Navigate to Reports screen
4. Your selected orders are automatically available in the report parameters

### 2. Batch Operations
**Scenario**: Updating multiple products at once

1. Go to Products table
2. Select products to update (✅ automatically synced)
3. Click "Batch Update" action
4. The system knows exactly which products to update

### 3. Related Record Navigation
**Scenario**: Working with invoice lines after selecting invoices

1. Select invoices in the Invoices table (✅ automatically synced)
2. Navigate to Invoice Lines tab
3. The system automatically filters to show only lines from your selected invoices

### 4. Cross-Module Workflows
**Scenario**: Creating shipments from selected sales orders

1. Select sales orders in Sales module (✅ automatically synced)
2. Navigate to Warehouse module
3. Create new shipment - your selected orders are pre-populated

## Troubleshooting

### Selection Not Persisting
**Symptoms**: Your selections don't appear in related screens

**Solutions**:
- ✅ Check your internet connection
- ✅ Refresh the page and try again
- ✅ Verify you're logged in (session may have expired)
- ✅ Contact your system administrator if the issue persists

### Slow Selection Response
**Symptoms**: Table feels sluggish when selecting records

**Solutions**:
- ✅ Check internet connection speed
- ✅ Try selecting fewer records at once
- ✅ Clear browser cache and cookies
- ✅ Contact support if consistently slow

### Missing Selected Records
**Symptoms**: Some selected records don't appear in related operations

**Solutions**:
- ✅ Verify you have proper permissions for those records
- ✅ Check that records haven't been deleted or modified by another user
- ✅ Re-select the records and try again
- ✅ Contact your system administrator

## Tips for Best Experience

### 1. Work with Manageable Selections
- ✅ **Recommended**: Select 10-50 records for most operations
- ⚠️ **Caution**: Selecting 100+ records may take slightly longer to sync
- ❌ **Avoid**: Selecting entire large datasets (1000+ records)

### 2. Stable Internet Connection
- ✅ Ensure stable internet connection for best synchronization
- ✅ If working with spotty connection, complete selections before navigating away

### 3. Browser Best Practices
- ✅ Keep your browser updated
- ✅ Clear browser cache periodically
- ✅ Don't block JavaScript (required for synchronization)

### 4. Workflow Organization
- ✅ Complete related selections before switching contexts
- ✅ Use descriptive selection criteria to remember your choices
- ✅ Take advantage of persistent selections for multi-step workflows

## FAQ

### Q: How long do my selections persist?
**A**: Selections persist for your entire browser session. They're cleared when you log out or your session expires.

### Q: Can other users see my selections?
**A**: No, selections are private to your user session. Each user maintains their own selection context.

### Q: What happens if I lose internet connection?
**A**: Tables continue to work normally. When your connection is restored, the next selection change will sync normally.

### Q: Is there a limit to how many records I can select?
**A**: There's no hard limit, but performance is optimized for typical business use cases (under 100 records). Very large selections may take slightly longer to sync.

### Q: Can I disable this feature?
**A**: The feature is integral to the application workflow. If you experience issues, contact your system administrator rather than trying to disable it.

### Q: Does this work on mobile devices?
**A**: Yes, session synchronization works on all devices that support the Etendo WorkspaceUI.

## Getting Help

### For Users
- 📞 Contact your internal help desk or system administrator
- 📧 Report issues through your organization's standard support channels
- 📚 Refer to your organization's user training materials

### For Administrators
- 📖 See the technical documentation in `/docs/architecture/session-sync.md`
- 🔧 Check system logs for session synchronization errors
- 🛠️ Review the troubleshooting guide in `/docs/troubleshooting/session-sync-admin-issues.md`

---

*This feature is designed to work seamlessly in the background. Most users will benefit from improved workflow efficiency without needing to learn new procedures.*
