import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

interface DesignCanvasProps {
  onUpdate: (json: any, dataUrl: string) => void;
  initialDesign?: any;
  side: 'front' | 'back';
}

export default function DesignCanvas({ onUpdate, initialDesign, side }: DesignCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [textSize, setTextSize] = useState(40);
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [strokeColor, setStrokeColor] = useState('#000000');

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas with T-shirt printable area dimensions
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 400,
      height: 500,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    });

    fabricCanvasRef.current = canvas;

    // Add guidelines for design area
    const addGuidelines = () => {
      // Print safe area guidelines
      const guideline = new fabric.Rect({
        left: 20,
        top: 20,
        width: 360,
        height: 460,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        opacity: 0.5,
      });
      canvas.add(guideline);
      canvas.sendObjectToBack(guideline);
    };

    addGuidelines();

    // Load initial design if provided
    if (initialDesign) {
      canvas.loadFromJSON(initialDesign, () => {
        canvas.renderAll();
      });
    }

    // Update parent on canvas change
    const handleUpdate = () => {
      const json = canvas.toJSON();
      const dataUrl = canvas.toDataURL({ 
        format: 'png',
        multiplier: 2, // Higher quality export
        enableRetinaScaling: true
      });
      onUpdate(json, dataUrl);
    };

    canvas.on('object:modified', handleUpdate);
    canvas.on('object:added', handleUpdate);
    canvas.on('object:removed', handleUpdate);

    return () => {
      canvas.dispose();
    };
  }, []);

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.IText('Your Text Here', {
      left: 100,
      top: 150,
      fontFamily: selectedFont,
      fontSize: textSize,
      fill: selectedColor,
      stroke: strokeWidth > 0 ? strokeColor : undefined,
      strokeWidth: strokeWidth,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.3)',
        blur: 5,
        offsetX: 2,
        offsetY: 2,
      }),
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const addShape = (shape: 'rect' | 'circle' | 'triangle' | 'star') => {
    if (!fabricCanvasRef.current) return;

    let obj: fabric.Object;

    switch (shape) {
      case 'rect':
        obj = new fabric.Rect({
          left: 150,
          top: 150,
          width: 100,
          height: 100,
          fill: selectedColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        });
        break;
      case 'circle':
        obj = new fabric.Circle({
          left: 150,
          top: 150,
          radius: 50,
          fill: selectedColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        });
        break;
      case 'triangle':
        obj = new fabric.Triangle({
          left: 150,
          top: 150,
          width: 100,
          height: 100,
          fill: selectedColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        });
        break;
      case 'star':
        const points = [];
        const numPoints = 5;
        const outerRadius = 50;
        const innerRadius = 25;
        
        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI * i) / numPoints;
          points.push({
            x: radius * Math.sin(angle),
            y: -radius * Math.cos(angle),
          });
        }
        
        obj = new fabric.Polygon(points, {
          left: 150,
          top: 150,
          fill: selectedColor,
          stroke: strokeWidth > 0 ? strokeColor : undefined,
          strokeWidth: strokeWidth,
        });
        break;
      default:
        return;
    }

    fabricCanvasRef.current.add(obj);
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.renderAll();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvasRef.current || !e.target.files?.[0]) return;

    const reader = new FileReader();
    const file = e.target.files[0];

    reader.onload = async (event) => {
      const imgUrl = event.target?.result as string | null;
      if (!imgUrl) return;

      try {
        const img = await new Promise<fabric.Image>((resolve, reject) => {
          fabric.Image.fromURL(
            imgUrl,
            (image) => {
              if (image) {
                resolve(image);
              } else {
                reject(new Error('Image failed to load'));
              }
            },
            { crossOrigin: 'anonymous' }
          );
        });

        img.scaleToWidth(200);
        img.set({
          left: 100,
          top: 100,
        });

        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.setActiveObject(img);
        fabricCanvasRef.current?.renderAll();
      } catch (error) {
        console.error('Error loading image:', error);
      } finally {
        e.target.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return;
    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    fabricCanvasRef.current.remove(...activeObjects);
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    // Keep only the guideline (first object)
    objects.slice(1).forEach(obj => {
      fabricCanvasRef.current?.remove(obj);
    });
    fabricCanvasRef.current.renderAll();
  };

  const bringToFront = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.bringObjectToFront(activeObject);
      fabricCanvasRef.current.renderAll();
    }
  };

  const sendToBack = () => {
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      fabricCanvasRef.current.sendObjectToBack(activeObject);
      // Keep guideline at the very back
      const guideline = fabricCanvasRef.current.getObjects()[0];
      if (guideline) {
        fabricCanvasRef.current.sendObjectToBack(guideline);
      }
      fabricCanvasRef.current.renderAll();
    }
  };

  const updateSelectedColor = (color: string) => {
    setSelectedColor(color);
    if (!fabricCanvasRef.current) return;
    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject) {
      activeObject.set('fill', color);
      fabricCanvasRef.current.renderAll();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 space-y-4">
        {/* Main Actions */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-2">Add Elements</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={addText}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <span>📝</span> Add Text
            </button>
            <button
              onClick={() => addShape('rect')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <span>⬜</span> Rectangle
            </button>
            <button
              onClick={() => addShape('circle')}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition flex items-center gap-2"
            >
              <span>⭕</span> Circle
            </button>
            <button
              onClick={() => addShape('triangle')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <span>🔺</span> Triangle
            </button>
            <button
              onClick={() => addShape('star')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center gap-2"
            >
              <span>⭐</span> Star
            </button>
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer flex items-center gap-2">
              <span>🖼️</span> Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Styling Options */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 uppercase">Fill Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => updateSelectedColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border-2 border-gray-300"
              />
              <div className="flex gap-1">
                {['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateSelectedColor(color)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 uppercase">Font Family</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Impact">Impact</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 uppercase">Text Size</label>
            <input
              type="number"
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              min="10"
              max="200"
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 uppercase">Stroke Width</label>
            <input
              type="number"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              min="0"
              max="20"
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 uppercase">Stroke Color</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer border-2 border-gray-300"
            />
          </div>
        </div>

        {/* Layer & Delete Controls */}
        <div className="pt-3 border-t">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Controls</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={bringToFront}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ⬆️ Bring Front
            </button>
            <button
              onClick={sendToBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              ⬇️ Send Back
            </button>
            <button
              onClick={deleteSelected}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              🗑️ Delete Selected
            </button>
            <button
              onClick={clearCanvas}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              🧹 Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200">
        <div className="mb-3 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            Design Area - {side === 'front' ? 'Front' : 'Back'} Side
          </h3>
          <span className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
            Blue dashed line = Print safe area
          </span>
        </div>
        <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
          <canvas ref={canvasRef} className="shadow-xl" />
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          💡 Tip: Keep important elements inside the blue dashed lines for best printing results
        </p>
      </div>
    </div>
  );
}
