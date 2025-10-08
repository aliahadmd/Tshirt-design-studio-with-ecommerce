import { useSnapshot } from 'valtio';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Type,
  Layers as LayersIcon,
} from 'lucide-react';
import designState, { layerActions, type Layer } from '../lib/designStore';

const LayersPanel = () => {
  const snap = useSnapshot(designState);

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'logo':
      case 'full':
        return <ImageIcon className="w-4 h-4" />;
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'shape':
        return <LayersIcon className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getLayerThumbnail = (layer: Layer) => {
    if (layer.type === 'text') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs text-white font-medium">
          Aa
        </div>
      );
    }
    if (layer.content) {
      return (
        <img
          src={layer.content}
          alt={layer.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-700">
        {getLayerIcon(layer.type)}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-5 h-5 text-white" />
          <h3 className="text-white font-bold text-sm">Layers</h3>
          <span className="text-gray-400 text-xs">({snap.layers.length})</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>Auto-saved</span>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {snap.layers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <LayersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No layers yet</p>
            <p className="text-xs mt-1">Add designs to create layers</p>
          </div>
        ) : (
          // Render layers in reverse order (top layer first)
          [...snap.layers].reverse().map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isSelected={snap.selectedLayerId === layer.id}
              onSelect={() => layerActions.selectLayer(layer.id)}
              getThumbnail={() => getLayerThumbnail(layer)}
            />
          ))
        )}
      </div>

      {/* Bottom Actions */}
      {snap.layers.length > 0 && (
        <div className="p-2 border-t border-gray-700 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              if (snap.selectedLayerId) {
                layerActions.duplicateLayer(snap.selectedLayerId);
              }
            }}
            disabled={!snap.selectedLayerId}
            className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1"
            title="Duplicate Layer"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
          <button
            onClick={() => {
              if (snap.selectedLayerId) {
                layerActions.removeLayer(snap.selectedLayerId);
              }
            }}
            disabled={!snap.selectedLayerId}
            className="flex-1 btn-danger text-xs py-1.5 flex items-center justify-center gap-1"
            title="Delete Layer"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface LayerItemProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: () => void;
  getThumbnail: () => React.ReactNode;
}

const LayerItem = ({ layer, isSelected, onSelect, getThumbnail }: LayerItemProps) => {
  const canMoveUp = () => {
    const snap = useSnapshot(designState);
    const index = snap.layers.findIndex(l => l.id === layer.id);
    return index < snap.layers.length - 1;
  };

  const canMoveDown = () => {
    const snap = useSnapshot(designState);
    const index = snap.layers.findIndex(l => l.id === layer.id);
    return index > 0;
  };

  return (
    <div
      className={`
        group rounded-lg transition-all border-2
        ${isSelected 
          ? 'bg-indigo-600/20 border-indigo-500' 
          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        }
        ${!layer.visible ? 'opacity-50' : ''}
        ${layer.locked ? 'cursor-not-allowed' : ''}
      `}
    >
      {/* Main Layer Info - Clickable */}
      <div
        onClick={onSelect}
        className="flex items-center gap-2 p-2 cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded bg-gray-700 overflow-hidden flex-shrink-0">
          {getThumbnail()}
        </div>

        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white text-sm font-medium truncate">
              {layer.name}
            </span>
            {isSelected && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-600 text-white rounded">
                Selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="capitalize">{layer.type}</span>
            <span>•</span>
            <span>{Math.round(layer.scale * 100)}%</span>
            {!layer.visible && (
              <>
                <span>•</span>
                <span className="text-yellow-400">Hidden</span>
              </>
            )}
            {layer.locked && (
              <>
                <span>•</span>
                <span className="text-yellow-400">Locked</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls Row - Separate from main area */}
      <div className="flex items-center justify-between px-2 pb-2 gap-2 border-t border-gray-700/50 pt-2 mt-1">
        {/* Left: Layer Order Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              layerActions.moveLayerUp(layer.id);
            }}
            disabled={!canMoveUp()}
            className="p-1.5 rounded bg-gray-900 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move Forward"
          >
            <ChevronUp className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              layerActions.moveLayerDown(layer.id);
            }}
            disabled={!canMoveDown()}
            className="p-1.5 rounded bg-gray-900 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move Backward"
          >
            <ChevronDown className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-1">
          {/* Visibility Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              layerActions.toggleLayerVisibility(layer.id);
            }}
            className="p-1.5 rounded hover:bg-gray-700 transition"
            title={layer.visible ? 'Hide Layer' : 'Show Layer'}
          >
            {layer.visible ? (
              <Eye className="w-4 h-4 text-green-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Lock Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              layerActions.toggleLayerLock(layer.id);
            }}
            className="p-1.5 rounded hover:bg-gray-700 transition"
            title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
          >
            {layer.locked ? (
              <Lock className="w-4 h-4 text-yellow-400" />
            ) : (
              <Unlock className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete layer "${layer.name}"?`)) {
                layerActions.removeLayer(layer.id);
              }
            }}
            className="p-1.5 rounded hover:bg-red-600 transition"
            title="Delete Layer"
          >
            <Trash2 className="w-4 h-4 text-red-400 group-hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;

