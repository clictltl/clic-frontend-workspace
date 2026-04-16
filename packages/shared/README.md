# @clic/shared

This package serves as the core library for the CLIC ecosystem. It contains shared UI components, state management plugins, authentication logic, and utility functions used by all applications in the workspace.

## Contents

### UI Components (`src/ui`)
Standardized interface elements to ensure consistency across editors:
- **Global Navigation**: `AppHeader`, `FileMenu` for project-level operations.
- **Modals**: Standardized dialogs for project management (Save, Share, Publish, Delete, and Open).
- **Feedback**: `ToastContainer` and `useToast` for reactive user notifications.

### State Management Plugins (`src/plugins`)
- **Interaction History**: A Pinia plugin that manages undo/redo functionality and generates interaction logs for learning analytics.
- **History Shortcuts**: Global keyboard listener for standard history actions (Undo/Redo).

### Authentication and API (`src/auth` & `src/utils`)
- **WordPress Integration**: Logic for session management and authentication via WordPress REST API.
- **Shared Projects**: `useSharedProjects` composable to handle standardized project I/O (Save/Load/Share).
- **Asset Management**: `useSharedAssetStore` for managing media uploads and synchronization with the WordPress Media Library.

### Analytics (`src/analytics`)
- Integration with Matomo for usage tracking within the platform.

## Usage

This package is designed to be consumed locally within the CLIC Monorepo via npm workspaces. Components and utilities are exported through the main `index.ts` file.

```typescript
import { AppHeader, useSharedProjects, useProjectStore } from '@clic/shared';
```

## Types

Centralized TypeScript definitions for the entire CLIC platform, including project schemas, asset metadata, and WordPress global variables.