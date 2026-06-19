# CLIC Emoji Coder

The Emoji Coder is a visual, block-based programming environment designed to introduce young students to computational thinking. Using a turtle graphics paradigm, it guides learners through progressive concepts—from absolute directional movement to spatial decentering (relative movement) and procedural abstractions—using an intuitive, textless-capable interface.

## Features

### Authoring Interface (Editor)
- **Progressive Libraries**: Offers distinct toolboxes (e.g., Grade 4, Grade 5) that scale in complexity, gradually introducing loops, relative movements, and functions.
- **Visual Procedures**: Supports entirely visual, icon-based function definitions (e.g., "Apple", "Banana") to teach encapsulation without the cognitive load of typing syntax.
- **Interactive Tutorials**: A state-driven educational dashboard featuring self-validating challenges. It automatically scopes the Blockly toolbox and isolates the workspace memory per challenge.
- **WYSIWYG Execution Panel**: A built-in Turtle Engine that provides real-time, step-by-step visual debugging synced with code execution speed.

### Visualization (Runtime)
- **Lightweight Player**: A purely execution-focused interface deployed for published projects, completely decoupled from the heavy Blockly library.
- **Pre-compiled AST Execution**: The runtime executes pre-saved, pure JSON Abstract Syntax Trees (ASTs) generated during the authoring phase, ensuring zero-compilation overhead and crash-free playback.
- **Responsive Grid Canvas**: A dynamic canvas that uses CSS Container Queries to perfectly scale the aspect ratio across all devices.

## Project Structure

- **`src/editor/`**: Contains the Blockly workspace integration, custom translations, and the educational dashboard UI.
- **`src/runtime/`**: Contains the lightweight entry point and the read-only execution player for published projects.
- **`src/libraries/`**: The core language definitions containing Blockly definitions, AST parsers, and Engine handlers organized by pedagogical grade.
- **`src/tutorials/`**: Stores the static challenge definitions, grid configurations, and validation hooks for the interactive learning modes.
- **`src/shared/`**: Contains the execution interpreter (`TurtleEngine`), shared components (`ExecutionPlayer`), and Pinia stores.

## Technical Implementation

- **AST-Driven Compilation**: Instead of interpreting code strings, visual blocks are compiled into a decoupled, clean JSON Abstract Syntax Tree via a custom recursive Tree Walker.
- **Agnostic Interpreter Engine**: The `TurtleEngine` utilizes Vue's `reactive` reactivity and a Command Pattern to execute the AST. It operates completely independently of the UI or Blockly itself.
- **Lazy Evaluation**: The architecture employs lazy loading for native block overrides to prevent top-level fatal errors in the Runtime environment.
- **GPU-Synchronized Animation**: Turtle movement animations are bound to dynamic CSS variables calculated precisely against the engine's logical tick rate to prevent visual desynchronization.

## Development

### Scripts

From the application directory:

```bash
npm run dev     # Start development server
npm run build   # Build for production (WordPress)
```

## Integration

Like other CLIC tools, the Emoji Coder operates in two modes:
1. **WordPress Mode**: Fully integrated for project persistence, sharing, and publishing via the CLIC Core plugin.
2. **Standalone Mode**: Can be deployed independently, allowing for local file import and export of project data .