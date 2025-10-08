import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

interface DesignCanvasNewProps {
  onExport: (dataUrl: string) => void;
}

const DesignCanvasNew = ({ onExport }: DesignCanvasNewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [textSize, setTextSize] = useState(60);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
    });

    fabricCanvasRef.current = canvas;

    const handleUpdate = () => {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 2,
        enableRetinaScaling: true,
      });
      onExport(dataUrl);
    };

    canvas.on('object:modified', handleUpdate);
    canvas.on('object:added', handleUpdate);
    canvas.on('object:removed', handleUpdate);

    return () => {
      canvas.dispose();
    };
  }, [onExport]);

  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.IText('Your Text', {
      left: 150,
      top: 200,
      fontFamily: selectedFont,
      fontSize: textSize,
      fill: selectedColor,
      fontWeight: 'bold',
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current) return;

    const circle = new fabric.Circle({
      left: 200,
      top: 200,
      radius: 50,
      fill: selectedColor,
    });

    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.renderAll();
  };

  const addRect = () => {
    if (!fabricCanvasRef.current) return;

    const rect = new fabric.Rect({
      left: 180,
      top: 180,
      width: 120,
      height: 120,
      fill: selectedColor,
    });

    fabricCanvasRef.current.add(rect);
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

        img.scaleToWidth(300);
        img.set({ left: 100, top: 100 });
        fabricCanvasRef.current?.add(img);
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
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = 'transparent';
    fabricCanvasRef.current.renderAll();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-lg space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={addText}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            📝 Add Text
          </button>
          <button
            onClick={addCircle}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            ⭕ Circle
          </button>
          <button
            onClick={addRect}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
          >
            ⬜ Rectangle
          </button>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer font-medium">
            🖼️ Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={deleteSelected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            🗑️ Delete
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            🧹 Clear
          </button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Color:</label>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Font:</label>
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Impact">Impact</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Size:</label>
            <input
              type="number"
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              min="20"
              max="200"
              className="w-20 px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-center">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
            <canvas ref={canvasRef} className="bg-gray-50" />
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Design your artwork here - it will appear on the T-shirt
        </p>
      </div>
    </div>
  );
};

export default DesignCanvasNew;
