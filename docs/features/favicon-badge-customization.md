# Favicon Badge Customization

## Overview

The Favicon Badge Customization feature allows users to personalize their browser tab by adding a colored indicator badge to the application's favicon. This visual distinction helps users quickly identify the Etendo WorkspaceUI tab when working with multiple browser tabs.

## Key Benefits

### 🎨 Visual Identification
Easily identify the Etendo WorkspaceUI tab among other open tabs with a distinctive colored badge overlay.

### 🔧 Personalization
Choose from multiple predefined colors to match your preference or organizational color scheme.

### 💾 Persistent Settings
Your badge color preference is stored locally and automatically restored on subsequent visits.

### ⚡ Instant Updates
Changes to the favicon badge are applied immediately without page refresh.

## How It Works

### User Interaction Flow
1. Open the **Quick Setup** modal from the header configuration button
2. Navigate to the **Favicon Badge** section
3. Select your preferred color from the available options:
   - **None**: No badge (default favicon)
   - **Red**: Red colored badge
   - **Green**: Green colored badge  
   - **Blue**: Blue colored badge
   - **Yellow**: Yellow colored badge
   - **Custom** (if configured): Organization-specific colors

### Technical Implementation

The feature uses the following components:

#### PreferencesContext (`/packages/MainUI/contexts/preferences.tsx`)
- Provides `customFaviconColor` state and `setCustomFaviconColor` setter
- Handles localStorage persistence with key `settings.favicon_badge`
- Uses Canvas API to dynamically overlay a colored badge on the base favicon

#### ConfigurationSection (`/packages/MainUI/components/Header/ConfigurationSection.tsx`)
- Integrates with the ConfigurationModal component
- Handles the `SECTION_FAVICON_BADGE_ID` section
- Maps color selections to the `setCustomFaviconColor` function

#### Constants (`ComponentLibrary/src/components/ConfigurationModal/constants.ts`)
- `SECTION_FAVICON_BADGE_ID`: Section identifier for the favicon badge configuration
- `FAVICON_BADGE_COLOR_ITEMS`: Array of available color options with their IDs and hex values

## Configuration Options

| Option | Color Code | Description |
|--------|------------|-------------|
| None | `null` | Default favicon without badge |
| Red | `#E53935` | Red badge indicator |
| Green | `#43A047` | Green badge indicator |
| Blue | `#1E88E5` | Blue badge indicator |
| Yellow | `#FDD835` | Yellow badge indicator |

## Storage

### LocalStorage Key
```
settings.favicon_badge
```

### Value Format
- `null` or absent: No badge (original favicon)
- `"#RRGGBB"`: Hex color string for the badge

## Files & Components

### Core Files

| File | Purpose |
|------|---------|
| `packages/MainUI/contexts/preferences.tsx` | Context provider managing favicon state and canvas rendering |
| `packages/MainUI/components/Header/ConfigurationSection.tsx` | UI integration with configuration modal |
| `packages/ComponentLibrary/src/components/ConfigurationModal/constants.ts` | Color options and section IDs |
| `packages/ComponentLibrary/src/locales/en.ts` | Translation keys for UI labels |

### Test Files

| File | Purpose |
|------|---------|
| `packages/MainUI/__tests__/contexts/preferences.test.tsx` | Unit tests for PreferencesContext |
| `packages/MainUI/__tests__/components/Header/ConfigurationSection.test.tsx` | Unit tests for ConfigurationSection integration |
| `packages/ComponentLibrary/src/components/ConfigurationModal/__tests__/ConfigurationModal.test.tsx` | Unit tests for ConfigurationModal |

## Translations

The feature uses the following translation keys:

```typescript
configuration.faviconBadge.title   // "Favicon Badge"
configuration.faviconBadge.none    // "None"
configuration.faviconBadge.red     // "Red"
configuration.faviconBadge.green   // "Green"
configuration.faviconBadge.blue    // "Blue"
configuration.faviconBadge.yellow  // "Yellow"
```

## Technical Details

### Canvas Rendering

The badge is rendered using the HTML5 Canvas API:

1. **Load Base Favicon**: The original `/favicon.ico` is loaded as an image
2. **Create Canvas**: A 64x64 canvas is created for high-resolution rendering
3. **Draw Favicon**: The base favicon is drawn on the canvas
4. **Draw Badge**: A circle with the selected color is drawn in the bottom-right corner
5. **Apply**: The canvas is converted to a data URL and set as the favicon link href

### Badge Specifications

- **Position**: Bottom-right corner of the favicon
- **Size**: 20% of the favicon size (approx. 13px on a 64px canvas)
- **Border**: 2px white stroke for contrast
- **Shape**: Circular

```
┌─────────────────┐
│                 │
│    [Favicon]    │
│                 │
│           ●─────│ ← Badge with white border
└─────────────────┘
```

## Error Handling

- **Image Load Failure**: If the base favicon fails to load, a warning is logged and no badge is applied
- **Canvas Unsupported**: If Canvas API is unavailable, the original favicon is preserved
- **Invalid Color**: If an invalid color is provided, no badge is drawn

## Browser Compatibility

The feature works on all modern browsers that support:
- HTML5 Canvas API
- Data URLs for favicon links
- LocalStorage

Tested browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Future Enhancements

Potential improvements for future versions:
- Custom color picker (user-defined hex values)
- Additional badge shapes (square, star, etc.)
- Badge with notification count
- Server-side persistence for cross-device sync

---

*Last updated: December 2025*
