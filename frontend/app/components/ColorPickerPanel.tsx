import { useSnapshot } from 'valtio';
import designState from '../lib/designStore';
import { useEffect, useState } from 'react';

const ColorPickerPanel = () => {
  const snap = useSnapshot(designState);
  const [SketchPicker, setSketchPicker] = useState<any>(null);

  useEffect(() => {
    // Dynamically import react-color on client-side only
    import('react-color').then((module) => {
      setSketchPicker(() => module.SketchPicker);
    });
  }, []);

  if (!SketchPicker) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-2xl border border-gray-200">
        <p className="text-gray-600 text-sm">Loading color picker...</p>
      </div>
    );
  }

  return (
    <div className="shadow-2xl rounded-lg overflow-hidden">
      <SketchPicker
        color={snap.color}
        disableAlpha
        onChange={(color: any) => {
          designState.color = color.hex;
        }}
        presetColors={[
          '#FFFFFF', // White
          '#000000', // Black
          '#CCCCCC', // Gray
          '#EFBD4E', // Gold
          '#80C670', // Green
          '#726DE8', // Purple
          '#353934', // Dark Gray
          '#2CCCE4', // Cyan
          '#FF8A65', // Coral
          '#7098DA', // Blue
          '#C19277', // Brown
          '#FF96AD', // Pink
          '#512314', // Dark Brown
          '#5F123D', // Maroon
        ]}
      />
    </div>
  );
};

export default ColorPickerPanel;
