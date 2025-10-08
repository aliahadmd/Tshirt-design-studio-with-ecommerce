import { proxy, subscribe } from 'valtio';

export type LayerType = 'logo' | 'full' | 'text' | 'shape';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  content: string; // URL for image, text content for text layer
  position: readonly [number, number, number]; // x, y, z position on shirt
  rotation: readonly [number, number, number]; // x, y, z rotation
  scale: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  createdAt: number;
}

interface DesignState {
  // T-shirt customization
  color: string;
  
  // Layer management
  layers: Layer[];
  selectedLayerId: string | null;
  
  // Legacy decals (for backward compatibility)
  logoDecal: string;
  fullDecal: string;
  isLogoTexture: boolean;
  isFullTexture: boolean;
  
  // Canvas state for saving
  canvasState: any;
  
  // History for undo/redo
  history: {
    past: any[];
    future: any[];
  };
}

// Load persisted state from localStorage
const loadPersistedState = (): Partial<DesignState> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const saved = localStorage.getItem('design-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        color: parsed.color || '#ffffff',
        layers: parsed.layers || [],
        selectedLayerId: null, // Don't persist selection
        logoDecal: parsed.logoDecal || '',
        fullDecal: parsed.fullDecal || '',
        isLogoTexture: parsed.isLogoTexture || false,
        isFullTexture: parsed.isFullTexture || false,
      };
    }
  } catch (error) {
    console.error('Failed to load design state:', error);
  }
  
  return {};
};

const initialState = loadPersistedState();

const designState = proxy<DesignState>({
  color: initialState.color || '#ffffff',
  layers: initialState.layers || [],
  selectedLayerId: null,
  logoDecal: initialState.logoDecal || '',
  fullDecal: initialState.fullDecal || '',
  isLogoTexture: initialState.isLogoTexture || false,
  isFullTexture: initialState.isFullTexture || false,
  canvasState: null,
  history: {
    past: [],
    future: [],
  },
});

// Subscribe to changes and persist to localStorage
if (typeof window !== 'undefined') {
  subscribe(designState, () => {
    try {
      const stateToPersist = {
        color: designState.color,
        layers: designState.layers,
        logoDecal: designState.logoDecal,
        fullDecal: designState.fullDecal,
        isLogoTexture: designState.isLogoTexture,
        isFullTexture: designState.isFullTexture,
      };
      localStorage.setItem('design-state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to save design state:', error);
    }
  });
}

// Helper to save state to history (called BEFORE changes)
const saveToHistory = () => {
  const currentState = JSON.parse(JSON.stringify(designState.layers));
  designState.history.past.push(currentState);
  designState.history.future = [];
  
  // Limit history to 50 states
  if (designState.history.past.length > 50) {
    designState.history.past.shift();
  }
};

// Layer Management Actions
export const layerActions = {
  addLayer: (layer: Omit<Layer, 'id' | 'createdAt'>) => {
    saveToHistory(); // Save current state before adding
    const newLayer: Layer = {
      ...layer,
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    designState.layers.push(newLayer);
    designState.selectedLayerId = newLayer.id;
    return newLayer.id;
  },

  removeLayer: (layerId: string) => {
    const index = designState.layers.findIndex(l => l.id === layerId);
    if (index !== -1) {
      saveToHistory(); // Save current state before removing
      const [removedLayer] = designState.layers.splice(index, 1);

      if (designState.selectedLayerId === layerId) {
        const nextIndex = Math.min(index, designState.layers.length - 1);
        designState.selectedLayerId = nextIndex >= 0 ? designState.layers[nextIndex]?.id ?? null : null;
      }

      const hasFullLayers = designState.layers.some(l => l.type === 'full');
      const hasLogoLayers = designState.layers.some(l => l.type === 'logo');

      if (!hasFullLayers && (removedLayer?.type === 'full' || designState.layers.length === 0)) {
        designState.isFullTexture = false;
        designState.fullDecal = '';
      }

      if (!hasLogoLayers && (removedLayer?.type === 'logo' || designState.layers.length === 0)) {
        designState.isLogoTexture = false;
        designState.logoDecal = '';
      }
    }
  },

  updateLayer: (layerId: string, updates: Partial<Layer>) => {
    const layer = designState.layers.find(l => l.id === layerId);
    if (layer) {
      // Don't save history for every small update (like dragging)
      // Only save for significant changes
      Object.assign(layer, updates);
    }
  },

  selectLayer: (layerId: string | null) => {
    designState.selectedLayerId = layerId;
  },

  moveLayerUp: (layerId: string) => {
    const index = designState.layers.findIndex(l => l.id === layerId);
    if (index < designState.layers.length - 1) {
      saveToHistory(); // Save current state before moving
      const layer = designState.layers[index];
      designState.layers.splice(index, 1);
      designState.layers.splice(index + 1, 0, layer);
    }
  },

  moveLayerDown: (layerId: string) => {
    const index = designState.layers.findIndex(l => l.id === layerId);
    if (index > 0) {
      saveToHistory(); // Save current state before moving
      const layer = designState.layers[index];
      designState.layers.splice(index, 1);
      designState.layers.splice(index - 1, 0, layer);
    }
  },

  toggleLayerVisibility: (layerId: string) => {
    const layer = designState.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = !layer.visible;
      // Don't save to history for visibility toggles - too frequent
    }
  },

  toggleLayerLock: (layerId: string) => {
    const layer = designState.layers.find(l => l.id === layerId);
    if (layer) {
      layer.locked = !layer.locked;
      // Don't save to history for lock toggles
    }
  },

  duplicateLayer: (layerId: string) => {
    const layer = designState.layers.find(l => l.id === layerId);
    if (layer) {
      saveToHistory(); // Save current state before duplicating
      const newLayer: Layer = {
        ...layer,
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${layer.name} Copy`,
        position: [layer.position[0] + 0.05, layer.position[1] + 0.05, layer.position[2]] as const,
        rotation: [...layer.rotation] as const,
        createdAt: Date.now(),
      };
      designState.layers.push(newLayer);
      designState.selectedLayerId = newLayer.id;
    }
  },

  clearAllLayers: () => {
    if (designState.layers.length > 0) {
      saveToHistory(); // Save current state before clearing
      designState.layers = [];
      designState.selectedLayerId = null;
      designState.logoDecal = '';
      designState.fullDecal = '';
      designState.isLogoTexture = false;
      designState.isFullTexture = false;
    }
  },

  clearDesign: () => {
    if (confirm('Clear entire design? This will remove all layers and reset the T-shirt.')) {
      saveToHistory(); // Save current state before clearing
      designState.layers = [];
      designState.selectedLayerId = null;
      designState.logoDecal = '';
      designState.fullDecal = '';
      designState.isLogoTexture = false;
      designState.isFullTexture = false;
      designState.color = '#ffffff';
    }
  },

  // History management
  undo: () => {
    if (designState.history.past.length > 0) {
      const previous = designState.history.past.pop();
      if (previous) {
        designState.history.future.push(JSON.parse(JSON.stringify(designState.layers)));
        designState.layers = previous;
        // Clear selection if undoing removes selected layer
        if (designState.selectedLayerId && !designState.layers.find(l => l.id === designState.selectedLayerId)) {
          designState.selectedLayerId = null;
        }
      }
    }
  },

  redo: () => {
    if (designState.history.future.length > 0) {
      const next = designState.history.future.pop();
      if (next) {
        designState.history.past.push(JSON.parse(JSON.stringify(designState.layers)));
        designState.layers = next;
        // Clear selection if redoing removes selected layer
        if (designState.selectedLayerId && !designState.layers.find(l => l.id === designState.selectedLayerId)) {
          designState.selectedLayerId = null;
        }
      }
    }
  },
};

export default designState;
