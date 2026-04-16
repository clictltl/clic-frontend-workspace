# CLIC Chatbot

The Chatbot is a visual, node-based tool for creating interactive pedagogical conversational flows. It allows users to design complex branching logic and data-driven interactions through a drag-and-drop interface.

## Features

### Visual Flow Editor
- **Node-based Canvas**: Design conversation paths using a visual drag-and-drop interface.
- **Block Types**: Includes 9 specialized blocks:
  - **Message**: Bot output.
  - **Open Question**: Captures free-text user input.
  - **Multiple Choice**: Button-based branching.
  - **Conditional**: Logic-based branching using variables.
  - **Set Variable**: Updates internal data.
  - **Math Operation**: Performs calculations on numeric variables.
  - **Image**: Displays visual content.
  - **Start/End**: Defines the flow boundaries.
- **Real-time Preview**: Integrated panel to test the conversation flow instantly.

### Variables and Logic
- **Data Persistence**: Create and manage custom variables (string or number).
- **Interpolation**: Use variables within message text using `{{variableName}}` syntax.
- **Conditional Branching**: Create different paths based on user responses or variable states.

## Project Structure

- **`src/editor/`**: The visual canvas, block components, and authoring panels.
- **`src/runtime/`**: The execution engine and the chat interface for end-users.
- **`src/shared/`**: Chatbot-specific state stores, types, and interpolation utilities.

## Technical Implementation

- **Runtime Engine**: A specialized engine manages the conversation state, variable evaluation, and block transitions.
- **Testing**: Includes a comprehensive test suite for the runtime logic using Vitest.
- **Shared Infrastructure**: Built upon `@clic/shared` for standardized WordPress connectivity and telemetry.

## Development

### Scripts

From the application directory:

```bash
npm run dev         # Start development server
npm run build       # Build for production (WordPress)
npm run test:run    # Execute unit tests
```

## Integration

The Chatbot Editor supports two primary environments:
1. **WordPress Mode**: Full integration for saving, sharing, and publishing projects within the CLIC platform.
2. **Standalone Mode**: Client-side execution with support for importing and exporting project data via JSON files.