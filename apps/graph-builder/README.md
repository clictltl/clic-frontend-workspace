# CLIC Graph Builder

The Graph Builder is a conceptual mapping and data visualization tool. It allows users to organize information into categories and visualize the relationships between different concepts as an interactive, node-link diagram.

## Features

### Authoring Interface (Editor)
- **Column-based Organization**: Categorize content into distinct, color-coded columns.
- **Node Management**: Create and edit cards (nodes) within specific categories.
- **Visual Connections**: Establish relationships between items across different categories.
- **Dynamic Forms**: Associate categories with public forms to allow external data collection that automatically populates the graph.

### Visualization (Runtime)
- **Interactive Graph**: A dynamic canvas powered by Cytoscape.js that renders nodes and edges based on the editor's data.
- **Contextual Navigation**: Explore connections through different levels of depth (Local vs. Global views).
- **Reader Layout**: A structured view for navigating and reading the content associated with each node.

## Project Structure

- **`src/editor/`**: Contains the board interface, category management, and properties panel used for authoring.
- **`src/runtime/`**: Contains the graph canvas, navigation components, and layouts for viewing the final project.
- **`src/shared/`**: Application-specific stores and TypeScript definitions.

## Technical Implementation

- **Data Structure**: Uses a normalized state for efficient node and category lookups.
- **Ordering**: Implements a weighted ordering system for maintaining visual consistency across the board and graph.
- **Graph Engine**: Utilizes Cytoscape.js for rendering and graph theory calculations.

## Development

### Scripts

From the application directory:

```bash
npm run dev     # Start development server
npm run build   # Build for production (WordPress)
```

## Integration

Like other CLIC tools, the Graph Builder operates in two modes:
1. **WordPress Mode**: Fully integrated for project persistence, sharing, and publishing via the CLIC Core plugin.
2. **Standalone Mode**: Can be deployed independently, allowing for local file import and export of project data.