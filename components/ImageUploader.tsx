
import React, { useRef } from 'react';
import { ReferenceImage } from '../types';
import { UploadIcon, TrashIcon } from './Icons';

interface ImageUploaderProps {
  referenceImage: ReferenceImage | null;
  setReferenceImage: (image: ReferenceImage | null) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

export const ImageUploader: React.FC<ImageUploaderProps> = ({ referenceImage, setReferenceImage }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setReferenceImage({ file, base64 });
    }
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      {!referenceImage ? (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-slate-600 hover:border-blue-500 bg-slate-900/50 rounded-lg p-6 text-center cursor-pointer transition-colors"
        >
          <div className="flex flex-col items-center justify-center text-slate-400">
            <UploadIcon className="w-8 h-8 mb-2" />
            <span className="font-semibold">Upload Image</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={`data:${referenceImage.file.type};base64,${referenceImage.base64}`} alt="preview" className="w-12 h-12 rounded object-cover" />
            <div className="text-sm overflow-hidden">
              <p className="text-white truncate font-medium">{referenceImage.file.name}</p>
              <p className="text-slate-400">{(referenceImage.file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button onClick={handleRemoveImage} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
};
