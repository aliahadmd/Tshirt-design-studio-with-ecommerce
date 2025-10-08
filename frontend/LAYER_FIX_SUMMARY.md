# Layer System Decal Fix

## Issue
The Decal components were throwing an error:
```
Error: Decal must have a Mesh as parent or specify its "mesh" prop
```

This was because Decals were wrapped in `<group>` elements for transform controls, but **Decals must be direct children of a Mesh**.

## Solution

### 1. **Separated Decal Rendering from Transform Controls**

**Before** (broken):
```tsx
<mesh>
  <group>  ← Decal inside a group - WRONG!
    <Decal ... />
    <TransformControls ... />
  </group>
</mesh>
```

**After** (fixed):
```tsx
<mesh>
  {/* Decals as direct children - CORRECT! */}
  <LayerDecalRenderer layer={layer} />
</mesh>

{/* Transform controls outside mesh */}
<TransformControlHelper layer={layer} />
```

### 2. **Helper Object Pattern**

The transform controls now manipulate an invisible "helper object" that:
- Sits outside the mesh (in a separate group)
- Shows a semi-transparent blue indicator when selected
- Updates the layer position/rotation/scale in the store
- The Decals then reactively update based on store changes

```tsx
<TransformControlHelper>
  <group ref={helperRef} position={layer.position}>
    {/* Visual indicator - blue transparent plane */}
    <mesh>
      <planeGeometry />
      <meshBasicMaterial color="#4f46e5" transparent opacity={0.3} />
    </mesh>
    
    {/* Transform controls attached to helper */}
    <TransformControls 
      object={helperRef.current}
      onChange={handleChange}  // Updates layer in store
    />
  </group>
</TransformControlHelper>
```

### 3. **Reactive Data Flow**

```
User drags transform control
    ↓
Helper object position updates
    ↓
handleChange() called
    ↓
layerActions.updateLayer(id, {position})
    ↓
designState.layers updated (Valtio)
    ↓
Components re-render with useSnapshot()
    ↓
Decal renders at new position
```

## Files Changed

- **`frontend/app/components/canvas/InteractiveShirt.tsx`**
  - Split rendering into `LayerDecalRenderer` and `TransformControlHelper`
  - Decals stay as direct children of mesh
  - Transform controls work on separate helper objects
  - Added visual indicator for selected layers

## Benefits

1. ✅ **No Decal errors** - Decals are properly parented to mesh
2. ✅ **Cleaner architecture** - Separation of concerns
3. ✅ **Visual feedback** - Blue indicator shows selected layer
4. ✅ **Proper TypeScript types** - All types correctly defined
5. ✅ **Reactive updates** - Store changes trigger re-renders

## How It Works Now

### Adding a Layer
1. Upload image → Creates layer in store
2. `LayerDecalRenderer` renders Decal as direct child of mesh
3. Decal appears on T-shirt at specified position

### Moving a Layer
1. Click layer in Layers panel → Sets `selectedLayerId`
2. `TransformControlHelper` appears at layer position
3. User drags transform gizmo
4. Helper object moves → `handleChange()` updates store
5. Decal re-renders at new position

### Current Limitations
- **Text layers**: Currently not rendered (text can't be a decal)
  - Future: Use 3D Text meshes or canvas textures
- **Transform modes**: Only "translate" (move) is enabled
  - Future: Add "rotate" and "scale" modes

## Testing

✅ TypeScript compilation passes  
✅ No linter errors  
✅ Decals render correctly  
✅ Transform controls appear for selected layers  
✅ Layer position updates work  

## Next Steps

If you encounter issues:
1. Clear browser cache and reload
2. Check browser console for errors
3. Verify layers appear in Layers panel
4. Try selecting and deselecting layers

---

**Status**: ✅ Fixed and Working  
**Date**: October 2025

