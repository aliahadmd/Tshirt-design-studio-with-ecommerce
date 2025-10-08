# Layer Management System - Photoshop-Style Design Editor

## Overview
We've implemented a professional Photoshop-style layer management system that allows users to create, manage, and directly manipulate design elements on the T-shirt in 3D space.

---

## Features

### 1. **Layer Management**
- ✅ Create multiple layers for designs
- ✅ Each layer can be an image (logo/full design), text, or shape
- ✅ Layer visibility toggle (show/hide)
- ✅ Layer locking (prevent accidental edits)
- ✅ Layer reordering (move forward/backward)
- ✅ Layer duplication
- ✅ Layer deletion
- ✅ Layer selection

### 2. **Direct Manipulation**
- ✅ Click and drag layers directly on the 3D T-shirt
- ✅ Interactive transform controls using mouse
- ✅ Move, rotate, and scale in 3D space
- ✅ Visual feedback with transform gizmos
- ✅ Real-time updates

### 3. **History & Undo/Redo**
- ✅ Full undo/redo support
- ✅ Keyboard shortcuts: `Ctrl+Z` (undo), `Ctrl+Shift+Z` (redo)
- ✅ 50-state history buffer
- ✅ Automatic history tracking on all changes

### 4. **Professional UI**
- ✅ Photoshop-style layers panel
- ✅ Layer thumbnails
- ✅ Layer properties display (name, type, scale)
- ✅ Quick action buttons
- ✅ Tabbed interface (Settings/Layers)

---

## Architecture

### File Structure

```
frontend/app/
├── lib/
│   └── designStore.ts           # Enhanced Valtio store with layers
├── components/
│   ├── LayersPanel.tsx          # Layers management UI
│   └── canvas/
│       ├── InteractiveShirt.tsx # 3D shirt with interactive layers
│       ├── Shirt.tsx            # Non-interactive version
│       └── CanvasModel.tsx      # Main 3D canvas
└── routes/
    └── designer-new.tsx         # Designer page with layer integration
```

### Data Structure

#### Layer Interface
```typescript
interface Layer {
  id: string;                              // Unique identifier
  name: string;                            // Display name
  type: 'logo' | 'full' | 'text' | 'shape'; // Layer type
  content: string;                         // Image URL or text content
  position: readonly [number, number, number]; // 3D position
  rotation: readonly [number, number, number]; // 3D rotation (radians)
  scale: number;                           // Scale multiplier
  visible: boolean;                        // Visibility state
  locked: boolean;                         // Lock state
  opacity: number;                         // Opacity (0-1)
  createdAt: number;                       // Timestamp
}
```

#### Design State
```typescript
interface DesignState {
  color: string;                    // T-shirt color
  layers: Layer[];                  // All design layers
  selectedLayerId: string | null;   // Currently selected layer
  history: {
    past: any[];                    // Undo stack
    future: any[];                  // Redo stack
  };
  // ... legacy fields for backward compatibility
}
```

---

## API Reference

### Layer Actions

#### `layerActions.addLayer(layer)`
Creates a new layer and adds it to the design.

```typescript
const layerId = layerActions.addLayer({
  name: 'My Logo',
  type: 'logo',
  content: 'data:image/png;base64,...',
  position: [0, 0.04, 0.15],
  rotation: [0, 0, 0],
  scale: 0.15,
  visible: true,
  locked: false,
  opacity: 1,
});
```

#### `layerActions.removeLayer(layerId)`
Deletes a layer by ID.

```typescript
layerActions.removeLayer('layer-123');
```

#### `layerActions.updateLayer(layerId, updates)`
Updates specific properties of a layer.

```typescript
layerActions.updateLayer('layer-123', {
  position: [0.1, 0.1, 0.15],
  scale: 0.2,
  opacity: 0.8,
});
```

#### `layerActions.selectLayer(layerId)`
Selects a layer (or null to deselect).

```typescript
layerActions.selectLayer('layer-123');
```

#### `layerActions.moveLayerUp(layerId)`
Moves a layer one position up in the stack (forward in render order).

```typescript
layerActions.moveLayerUp('layer-123');
```

#### `layerActions.moveLayerDown(layerId)`
Moves a layer one position down in the stack (backward in render order).

```typescript
layerActions.moveLayerDown('layer-123');
```

#### `layerActions.toggleLayerVisibility(layerId)`
Toggles layer visibility.

```typescript
layerActions.toggleLayerVisibility('layer-123');
```

#### `layerActions.toggleLayerLock(layerId)`
Toggles layer lock state.

```typescript
layerActions.toggleLayerLock('layer-123');
```

#### `layerActions.duplicateLayer(layerId)`
Creates a copy of the specified layer.

```typescript
layerActions.duplicateLayer('layer-123');
```

#### `layerActions.clearAllLayers()`
Removes all layers.

```typescript
layerActions.clearAllLayers();
```

#### `layerActions.undo()`
Reverts to the previous state.

```typescript
layerActions.undo();
```

#### `layerActions.redo()`
Re-applies the next state.

```typescript
layerActions.redo();
```

---

## Usage Examples

### Adding a Logo Layer

```typescript
const handleFileUpload = (dataUrl: string) => {
  layerActions.addLayer({
    name: 'Uploaded Logo',
    type: 'logo',
    content: dataUrl,
    position: [0, 0.04, 0.15],  // Chest position
    rotation: [0, 0, 0],
    scale: 0.15,                // Small scale for logo
    visible: true,
    locked: false,
    opacity: 1,
  });
};
```

### Adding a Text Layer

```typescript
const handleAddText = (text: string) => {
  layerActions.addLayer({
    name: 'Text Layer',
    type: 'text',
    content: text,
    position: [0, 0.1, 0.15],
    rotation: [0, 0, 0],
    scale: 1,
    visible: true,
    locked: false,
    opacity: 1,
  });
};
```

### Moving a Layer Programmatically

```typescript
const snap = useSnapshot(designState);

// Move selected layer to new position
if (snap.selectedLayerId) {
  layerActions.updateLayer(snap.selectedLayerId, {
    position: [0.1, 0.2, 0.15],
  });
}
```

---

## User Interactions

### Direct Manipulation on 3D Canvas

1. **Select a Layer**
   - Click on the layer in the Layers panel
   - The layer will show transform controls on the 3D shirt

2. **Move a Layer**
   - Click and drag the layer directly on the T-shirt
   - The layer position updates in real-time
   - Red/green/blue arrows control X/Y/Z axes

3. **Rotate a Layer** (when mode is set to 'rotate')
   - Use the rotation gizmo to rotate the layer
   - Rotation is in 3D space

4. **Scale a Layer** (when mode is set to 'scale')
   - Use the scale gizmo to resize the layer
   - Uniform scaling maintains aspect ratio

### Layers Panel Controls

1. **Show/Hide Layer**
   - Click the eye icon (👁️ / 🚫)
   - Hidden layers are not rendered but remain in the design

2. **Lock/Unlock Layer**
   - Click the lock icon (🔒 / 🔓)
   - Locked layers cannot be transformed or edited

3. **Move Layer Forward/Backward**
   - Hover over a selected layer
   - Click the up/down arrows (↑/↓)
   - Controls render order (z-index)

4. **Duplicate Layer**
   - Select a layer
   - Click "Duplicate" button at bottom
   - Creates a copy with slight offset

5. **Delete Layer**
   - Select a layer
   - Click "Delete" button at bottom
   - Layer is removed (can be undone)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| (More can be added) | |

---

## Implementation Details

### Transform Controls
We use `@react-three/drei`'s `TransformControls` component for direct manipulation:

```typescript
<TransformControls
  object={groupRef.current}
  mode="translate"           // Can be 'translate', 'rotate', or 'scale'
  size={0.5}                 // Size of the gizmo
  showX={true}
  showY={true}
  showZ={false}              // Disable Z for 2D-like control
  camera={camera}
  domElement={gl.domElement}
  onChange={handleTransformChange}
  onMouseDown={() => setIsDragging(true)}
  onMouseUp={() => setIsDragging(false)}
/>
```

### History Management
History is automatically saved on every layer modification:

```typescript
const saveToHistory = () => {
  const currentState = JSON.parse(JSON.stringify(designState.layers));
  designState.history.past.push(currentState);
  designState.history.future = [];
  
  // Limit to 50 states
  if (designState.history.past.length > 50) {
    designState.history.past.shift();
  }
};
```

### Layer Rendering
Layers are rendered in order (first layer is bottom-most):

```typescript
{snap.layers.map((layer) => (
  <InteractiveLayerRenderer
    key={layer.id}
    layer={layer}
    isSelected={snap.selectedLayerId === layer.id}
  />
))}
```

---

## Performance Considerations

1. **Texture Loading**: Images are loaded on-demand using `useTexture` with Suspense fallbacks
2. **Render Optimization**: Only visible layers are rendered
3. **History Limit**: History is capped at 50 states to prevent memory issues
4. **Transform Throttling**: Transform updates are batched during drag operations

---

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Mobile browsers (limited touch support for 3D controls)

---

## Future Enhancements

### Potential Features
- [ ] Layer groups/folders
- [ ] Layer blending modes
- [ ] Layer effects (shadow, glow, etc.)
- [ ] Smart guides for alignment
- [ ] Snap-to-grid functionality
- [ ] Multi-layer selection
- [ ] Copy/paste layers
- [ ] Layer search/filter
- [ ] Export individual layers
- [ ] Layer templates

### Improvements
- [ ] Better mobile touch controls
- [ ] Keyboard navigation in layers panel
- [ ] Drag-and-drop layer reordering
- [ ] Layer thumbnails with live preview
- [ ] Customizable keyboard shortcuts
- [ ] Layer animation support
- [ ] Version history/snapshots

---

## Troubleshooting

### Layer not showing on T-shirt
1. Check if layer is visible (eye icon should be green)
2. Verify the position is within T-shirt bounds
3. Check the scale - too small layers might not be visible
4. Ensure the content (image URL) is valid

### Transform controls not appearing
1. Make sure the layer is selected in the Layers panel
2. Check if the layer is locked (unlock it first)
3. Verify the layer is visible

### Undo/Redo not working
1. Check if there are states in history (buttons should be enabled)
2. Try the keyboard shortcuts: `Ctrl+Z` or `Ctrl+Shift+Z`
3. History is cleared on page refresh

### Performance issues with many layers
1. Reduce the number of visible layers
2. Lower the resolution of uploaded images
3. Use smaller image files
4. Consider removing unused layers

---

## Code Examples

### Complete Layer Management Component

```typescript
import { useSnapshot } from 'valtio';
import designState, { layerActions } from './lib/designStore';

function MyLayerManager() {
  const snap = useSnapshot(designState);

  const addLogo = () => {
    layerActions.addLayer({
      name: 'Logo',
      type: 'logo',
      content: '/path/to/logo.png',
      position: [0, 0.04, 0.15],
      rotation: [0, 0, 0],
      scale: 0.15,
      visible: true,
      locked: false,
      opacity: 1,
    });
  };

  return (
    <div>
      <button onClick={addLogo}>Add Logo</button>
      <button onClick={() => layerActions.undo()} 
              disabled={snap.history.past.length === 0}>
        Undo
      </button>
      <div>
        {snap.layers.map(layer => (
          <div key={layer.id}>
            {layer.name}
            <button onClick={() => layerActions.removeLayer(layer.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Testing

### Manual Testing Checklist
- [ ] Add multiple layers of different types
- [ ] Move layers using drag-and-drop on 3D canvas
- [ ] Toggle layer visibility
- [ ] Lock/unlock layers
- [ ] Reorder layers (forward/backward)
- [ ] Duplicate layers
- [ ] Delete layers
- [ ] Undo/redo operations
- [ ] Test keyboard shortcuts
- [ ] Test with large images
- [ ] Test layer selection
- [ ] Test on different screen sizes

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in the implementation files
3. Test with the browser console open to see any errors
4. Verify all dependencies are installed correctly

---

**Last Updated**: October 2025
**Version**: 1.0.0

