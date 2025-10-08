import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useSnapshot } from 'valtio';
import { 
  Palette, 
  Upload, 
  Pencil, 
  Save, 
  ShoppingCart,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Undo,
  Redo,
  Layers as LayersIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CanvasModel from '../components/canvas/CanvasModel';
import ColorPickerPanel from '../components/ColorPickerPanel';
import FilePickerPanel from '../components/FilePickerPanel';
import EnhancedCanvasDesigner from '../components/EnhancedCanvasDesigner';
import LayersPanel from '../components/LayersPanel';
import { useCartStore } from '../lib/store';
import { useAuthGuard } from '../hooks/useAuthGuard';
import designState, { layerActions } from '../lib/designStore';
import { designAPI } from '../lib/api';
import type { Route } from './+types/designer-new';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'T-Shirt Designer - Create Your Design' },
    { name: 'description', content: 'Design custom t-shirts with our professional 3D designer' },
  ];
}

type EditorTab = '' | 'colorpicker' | 'filepicker' | 'canvasdesign';

export default function DesignerNew() {
  const navigate = useNavigate();
  const { isReady, user } = useAuthGuard();
  const { addItem } = useCartStore();
  const snap = useSnapshot(designState);

  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('');
  const [designName, setDesignName] = useState('My Awesome Design');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [showLayers, setShowLayers] = useState(true);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          layerActions.redo();
        } else {
          layerActions.undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileRead = (type: 'logo' | 'full', dataUrl: string) => {
    // Create a new layer for the uploaded file
    const layerName = type === 'logo' ? 'Logo Design' : 'Full Design';
    const position: [number, number, number] = type === 'logo' 
      ? [0, 0.04, 0.15] 
      : [0, 0, 0.15];
    const scale = type === 'logo' ? 0.15 : 1;

    layerActions.addLayer({
      name: layerName,
      type: type,
      content: dataUrl,
      position,
      rotation: [0, 0, 0],
      scale,
      visible: true,
      locked: false,
      opacity: 1,
    });

    // Also update legacy state for backward compatibility
    if (type === 'logo') {
      designState.logoDecal = dataUrl;
      designState.isLogoTexture = true;
    } else {
      designState.fullDecal = dataUrl;
      designState.isFullTexture = true;
    }
    
    setActiveEditorTab('');
    setMessage('✅ Layer added! You can now drag and transform it on the T-shirt.');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCanvasExport = (dataUrl: string) => {
    if (dataUrl && dataUrl !== 'data:image/png;base64,') {
      // Create a new layer for the canvas design
      layerActions.addLayer({
        name: 'Canvas Design',
        type: 'full',
        content: dataUrl,
        position: [0, 0, 0.15],
        rotation: [0, 0, 0],
        scale: 1,
        visible: true,
        locked: false,
        opacity: 1,
      });

      // Legacy compatibility
      designState.fullDecal = dataUrl;
      designState.isFullTexture = true;
      
      setMessage('✅ Canvas design added as layer!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleDecal = (type: 'logo' | 'full') => {
    if (type === 'logo') {
      designState.isLogoTexture = !designState.isLogoTexture;
    } else {
      designState.isFullTexture = !designState.isFullTexture;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      await designAPI.create({
        name: designName,
        frontDesign: {
          color: snap.color,
          logoDecal: snap.logoDecal,
          fullDecal: snap.fullDecal,
          isLogoTexture: snap.isLogoTexture,
          isFullTexture: snap.isFullTexture,
          layers: snap.layers,
        },
        backDesign: null,
        tshirtColor: snap.color,
        thumbnail: snap.fullDecal || snap.logoDecal || (snap.layers[0]?.content),
      });

      setMessage('✅ Design saved successfully!');
      setTimeout(() => navigate('/designs'), 1500);
    } catch (error) {
      setMessage('❌ Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (!snap.logoDecal && !snap.fullDecal && snap.layers.length === 0) {
      alert('Please add a design first!');
      return;
    }

    setSaving(true);
    setMessage('Saving design and adding to cart...');

    try {
      // Save the design first to get a real design ID
      const response = await designAPI.create({
        name: designName,
        frontDesign: {
          color: snap.color,
          logoDecal: snap.logoDecal,
          fullDecal: snap.fullDecal,
          isLogoTexture: snap.isLogoTexture,
          isFullTexture: snap.isFullTexture,
          layers: snap.layers,
        },
        backDesign: null,
        tshirtColor: snap.color,
        thumbnail: snap.fullDecal || snap.logoDecal || (snap.layers[0]?.content),
      });

      const savedDesign = response.data;

      // Add to cart with the real design ID
      addItem({
        designId: savedDesign.id,
        designName,
        quantity: 1,
        size: selectedSize,
        price: 0,
        thumbnail: snap.fullDecal || snap.logoDecal || (snap.layers[0]?.content),
      });

      setMessage('✅ Design saved and added to cart!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to save design. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const downloadImage = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${designName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const resetDesign = () => {
    layerActions.clearDesign();
    setDesignName('My Awesome Design');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Designer Layout - Photoshop Style */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="toolbar flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg border-2 border-gray-600 focus:border-indigo-500 outline-none flex-1 min-w-0 max-w-sm"
              placeholder="Design Name"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => layerActions.undo()} 
              disabled={snap.history.past.length === 0}
              className="btn-secondary p-2" 
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button 
              onClick={() => layerActions.redo()} 
              disabled={snap.history.future.length === 0}
              className="btn-secondary p-2" 
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-600" />
            <button onClick={resetDesign} className="btn-secondary p-2" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={downloadImage} className="btn-secondary p-2" title="Download">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-success flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button onClick={() => navigate('/designs')} className="btn-secondary hidden lg:block">
              My Designs
            </button>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-2 text-center font-medium ${
            message.includes('✅') ? 'bg-green-600/20 text-green-200' : 'bg-red-600/20 text-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar - Tools */}
          <div className="sidebar w-20 md:w-24 flex-shrink-0 flex flex-col items-center py-4 gap-3">
            <ToolIcon
              icon={<Palette />}
              label="Color"
              active={activeEditorTab === 'colorpicker'}
              onClick={() => setActiveEditorTab(activeEditorTab === 'colorpicker' ? '' : 'colorpicker')}
            />
            <ToolIcon
              icon={<Upload />}
              label="Upload"
              active={activeEditorTab === 'filepicker'}
              onClick={() => setActiveEditorTab(activeEditorTab === 'filepicker' ? '' : 'filepicker')}
            />
            <ToolIcon
              icon={<Pencil />}
              label="Draw"
              active={activeEditorTab === 'canvasdesign'}
              onClick={() => setActiveEditorTab(activeEditorTab === 'canvasdesign' ? '' : 'canvasdesign')}
            />

            <div className="divider w-full" />

            <ToolIcon
              icon={snap.isLogoTexture ? <Eye /> : <EyeOff />}
              label="Logo"
              active={snap.isLogoTexture}
              onClick={() => toggleDecal('logo')}
              disabled={!snap.logoDecal}
            />
            <ToolIcon
              icon={snap.isFullTexture ? <Eye /> : <EyeOff />}
              label="Full"
              active={snap.isFullTexture}
              onClick={() => toggleDecal('full')}
              disabled={!snap.fullDecal}
            />
          </div>

          {/* Center - 3D Canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 flex items-center justify-center p-4 md:p-8">
              <div className="w-full h-full max-w-4xl max-h-full flex items-center justify-center">
                <CanvasModel />
              </div>
            </div>

            {/* Canvas Controls */}
            <div className="bg-gray-800 border-t border-gray-700 p-3 flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <div className="flex items-center text-white text-sm">
                <span className="mr-2">Color:</span>
                <span 
                  className="inline-block w-6 h-6 rounded border-2 border-white"
                  style={{ backgroundColor: snap.color }}
                />
              </div>
              {snap.isLogoTexture && (
                <div className="flex items-center text-green-400 text-sm">
                  <span>✓ Logo Applied</span>
                </div>
              )}
              {snap.isFullTexture && (
                <div className="flex items-center text-green-400 text-sm">
                  <span>✓ Full Design Applied</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Settings & Layers */}
          <div className="sidebar-right w-64 md:w-80 flex-shrink-0 flex flex-col">
            {/* Tab Switcher */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setShowLayers(false)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  !showLayers
                    ? 'text-white bg-gray-800 border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setShowLayers(true)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  showLayers
                    ? 'text-white bg-gray-800 border-b-2 border-indigo-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <LayersIcon className="w-4 h-4" />
                Layers
              </button>
            </div>

            {/* Content Area */}
            {showLayers ? (
              <LayersPanel />
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Size Selection */}
                <div>
                  <label className="block text-white font-semibold mb-3">Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`text-center ${size === selectedSize ? 'tool-btn-active' : 'tool-btn-inactive'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Preview */}
                <div>
                  <label className="block text-white font-semibold mb-3">Shirt Color</label>
                  <div 
                    className="w-full h-24 rounded-lg border-2 border-gray-600 shadow-inner transition-colors duration-200"
                    style={{ backgroundColor: snap.color }}
                  />
                  <p className="text-gray-400 text-sm mt-2 text-center font-mono">{snap.color.toUpperCase()}</p>
                </div>

                {/* Quick Actions */}
                <div>
                  <label className="block text-white font-semibold mb-3">Quick Actions</label>
                  <div className="space-y-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={saving}
                      className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {saving ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => navigate('/cart')}
                      className="btn-outline w-full"
                    >
                      View Cart
                    </button>
                  </div>
                </div>

                {/* Design Info */}
                <div className="bg-gray-800 rounded-lg p-3">
                  <h4 className="text-white font-semibold mb-2 text-sm">Design Info</h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Size: {selectedSize}</div>
                    <div>Price: $0.00 (Free)</div>
                    <div>Layers: {snap.layers.length}</div>
                    <div>Selected: {snap.selectedLayerId ? '✓' : '✗'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Panels */}
      {activeEditorTab === 'colorpicker' && (
        <div className="fixed left-20 md:left-24 top-24 z-40 animate-in fade-in slide-in-from-left-2 duration-200">
          <ColorPickerPanel />
        </div>
      )}

      {activeEditorTab === 'filepicker' && (
        <div className="fixed left-20 md:left-24 top-24 z-40 animate-in fade-in slide-in-from-left-2 duration-200">
          <FilePickerPanel onFileRead={handleFileRead} />
        </div>
      )}

      {/* Canvas Designer Modal */}
      <EnhancedCanvasDesigner
        isOpen={activeEditorTab === 'canvasdesign'}
        onClose={() => setActiveEditorTab('')}
        onExport={handleCanvasExport}
      />
    </div>
  );
}

// Tool Icon Component
interface ToolIconProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolIcon = ({ icon, label, active, onClick, disabled }: ToolIconProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`
        group relative w-12 h-12 md:w-16 md:h-16 flex flex-col items-center justify-center
        rounded-lg transition-all
        ${active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' 
          : disabled
          ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
        }
      `}
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-[10px] mt-1 hidden md:block">{label}</span>
      
      {/* Tooltip for mobile */}
      <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none md:hidden">
        {label}
      </span>
    </button>
  );
};
