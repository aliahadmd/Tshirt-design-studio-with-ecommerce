import { useState, type ChangeEvent } from 'react';

interface FilePickerPanelProps {
  onFileRead: (type: 'logo' | 'full', dataUrl: string) => void;
}

const FilePickerPanel = ({ onFileRead }: FilePickerPanelProps) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const readFile = (type: 'logo' | 'full') => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onFileRead(type, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-2xl border border-gray-200 min-w-[280px]">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Upload Design
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              file:transition-colors
              cursor-pointer border border-gray-300 rounded-lg p-2"
          />
          {file && (
            <p className="text-xs text-gray-500 mt-2 truncate" title={file.name}>
              Selected: {file.name}
            </p>
          )}
        </div>

        {file && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Apply as:</p>
            <button
              onClick={() => readFile('logo')}
              className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Logo</span>
              <span className="text-xs opacity-75">(Chest)</span>
            </button>
            <button
              onClick={() => readFile('full')}
              className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Full Design</span>
              <span className="text-xs opacity-75">(All over)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePickerPanel;

