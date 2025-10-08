import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import TShirt3D from '../components/TShirt3D';
import DesignCanvas from '../components/DesignCanvas';
import { useAuthStore, useDesignStore, useCartStore } from '../lib/store';
import { designAPI } from '../lib/api';
import type { Route } from './+types/designer';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Designer Studio - TShirt Builder' },
    { name: 'description', content: 'Design your custom t-shirt in 3D' },
  ];
}

export default function Designer() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentDesign, setDesignName, setFrontDesign, setBackDesign, setTshirtColor, resetDesign } = useDesignStore();
  const { addItem } = useCartStore();

  const [showFront, setShowFront] = useState(true);
  const [tshirtColor, setLocalTshirtColor] = useState(currentDesign.tshirtColor);
  const [frontDataUrl, setFrontDataUrl] = useState<string>('');
  const [backDataUrl, setBackDataUrl] = useState<string>('');
  const [designName, setLocalDesignName] = useState(currentDesign.name);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState('M');
  const [viewMode, setViewMode] = useState<'split' | 'design' | '3d'>('split');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleFrontUpdate = (json: any, dataUrl: string) => {
    setFrontDesign(json);
    setFrontDataUrl(dataUrl);
  };

  const handleBackUpdate = (json: any, dataUrl: string) => {
    setBackDesign(json);
    setBackDataUrl(dataUrl);
  };

  const handleColorChange = (color: string) => {
    setLocalTshirtColor(color);
    setTshirtColor(color);
  };

  const handleSaveDesign = async () => {
    if (!currentDesign.frontDesign) {
      setSaveMessage('⚠️ Please add some design to the front');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      await designAPI.create({
        name: designName,
        frontDesign: currentDesign.frontDesign,
        backDesign: currentDesign.backDesign,
        tshirtColor: tshirtColor,
        thumbnail: frontDataUrl,
      });

      setSaveMessage('✅ Design saved successfully!');
      setTimeout(() => {
        navigate('/designs');
      }, 1500);
    } catch (error) {
      setSaveMessage('❌ Failed to save design');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = () => {
    if (!currentDesign.frontDesign) {
      alert('Please add some design first');
      return;
    }

    addItem({
      designId: `temp-${Date.now()}`,
      designName: designName,
      quantity: 1,
      size: selectedSize,
      price: 0,
      thumbnail: frontDataUrl,
    });

    alert('✅ Added to cart! Save your design to complete the order.');
  };

  const handleNewDesign = () => {
    if (confirm('Start a new design? Any unsaved changes will be lost.')) {
      resetDesign();
      setLocalDesignName('Untitled Design');
      setLocalTshirtColor('#ffffff');
      setFrontDataUrl('');
      setBackDataUrl('');
      setShowFront(true);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={designName}
                onChange={(e) => {
                  setLocalDesignName(e.target.value);
                  setDesignName(e.target.value);
                }}
                className="text-2xl font-bold border-2 border-transparent hover:border-gray-300 focus:border-indigo-600 outline-none px-3 py-1 rounded-lg transition"
                placeholder="Design Name"
              />
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Editing {showFront ? 'Front' : 'Back'}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleNewDesign}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition shadow-md"
              >
                🆕 New Design
              </button>
              <button
                onClick={handleSaveDesign}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition shadow-md font-semibold"
              >
                {saving ? '💾 Saving...' : '💾 Save Design'}
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className={`mt-3 p-3 rounded-lg font-medium ${
              saveMessage.includes('✅') 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : saveMessage.includes('❌')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-6 flex justify-center gap-2">
          <button
            onClick={() => setViewMode('split')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              viewMode === 'split'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Split View
          </button>
          <button
            onClick={() => setViewMode('design')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              viewMode === 'design'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✏️ Design Only
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              viewMode === '3d'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🎨 3D Preview Only
          </button>
        </div>

        {/* Main Content */}
        <div className={`grid gap-6 ${
          viewMode === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          {/* 3D Preview */}
          {(viewMode === 'split' || viewMode === '3d') && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">3D Preview</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFront(true)}
                      className={`px-6 py-2 rounded-lg font-semibold transition shadow ${
                        showFront 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      👕 Front
                    </button>
                    <button
                      onClick={() => setShowFront(false)}
                      className={`px-6 py-2 rounded-lg font-semibold transition shadow ${
                        !showFront 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      👕 Back
                    </button>
                  </div>
                </div>

                <div className="h-[600px] rounded-lg overflow-hidden">
                  <TShirt3D
                    color={tshirtColor}
                    frontTexture={frontDataUrl}
                    backTexture={backDataUrl}
                    showFront={showFront}
                  />
                </div>
              </div>

              {/* T-shirt Settings */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="font-bold text-lg mb-4 text-gray-800">T-Shirt Settings</h3>
                
                {/* Color Picker */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    T-Shirt Color
                  </label>
                  <div className="flex gap-3 items-center flex-wrap">
                    <input
                      type="color"
                      value={tshirtColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-300 shadow"
                    />
                    {[
                      { color: '#ffffff', name: 'White' },
                      { color: '#000000', name: 'Black' },
                      { color: '#1f2937', name: 'Navy' },
                      { color: '#dc2626', name: 'Red' },
                      { color: '#059669', name: 'Green' },
                      { color: '#2563eb', name: 'Blue' },
                      { color: '#eab308', name: 'Yellow' },
                      { color: '#ec4899', name: 'Pink' },
                    ].map(({ color, name }) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className="relative group"
                        title={name}
                      >
                        <div
                          className={`w-12 h-12 rounded-lg border-3 transition shadow-md hover:scale-110 ${
                            tshirtColor === color ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                        <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Picker */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Size
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg font-semibold transition shadow ${
                          selectedSize === size
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-lg shadow-lg">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-white text-indigo-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🛒 Add to Cart (Size: {selectedSize})
                </button>
                <p className="text-sm text-white text-center mt-3">
                  💰 Free for MVP - No payment required
                </p>
              </div>
            </div>
          )}

          {/* Design Canvas */}
          {(viewMode === 'split' || viewMode === 'design') && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg shadow-md border border-purple-200">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">
                  Design {showFront ? 'Front' : 'Back'} Side
                </h2>
                <p className="text-sm text-gray-600">
                  Add text, images, and shapes to create your unique design. Your changes appear in real-time on the 3D preview!
                </p>
              </div>

              {showFront ? (
                <DesignCanvas
                  onUpdate={handleFrontUpdate}
                  initialDesign={currentDesign.frontDesign}
                  side="front"
                />
              ) : (
                <DesignCanvas
                  onUpdate={handleBackUpdate}
                  initialDesign={currentDesign.backDesign}
                  side="back"
                />
              )}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">💡 Quick Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use the <strong>Split View</strong> to see your design on the 3D T-shirt in real-time</li>
            <li>• Keep important elements inside the <strong>blue dashed lines</strong> for best printing</li>
            <li>• Switch between <strong>Front</strong> and <strong>Back</strong> to design both sides</li>
            <li>• Save your design regularly to avoid losing your work</li>
            <li>• Drag elements around and resize them for the perfect look</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
