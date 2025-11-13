import React from 'react';
import { FormData, AspectRatio, ScriptStats } from '../types';
import { InputSection } from './InputSection';
import { ImageUploader } from './ImageUploader';
import { UploadIcon, HashIcon, TagIcon, ImageIcon, SparklesIcon, AspectRatioIcon, SettingsIcon } from './Icons';

interface ControlPanelProps {
  formData: FormData;
  onFormChange: (field: keyof FormData, value: any) => void;
  onGenerate: () => void;
  isLoading: boolean;
  scriptStats: ScriptStats;
  enableImageGeneration: boolean;
  setEnableImageGeneration: (enabled: boolean) => void;
  onSuggestScenes: () => void;
  isSuggestingScenes: boolean;
}

const aspectRatios: AspectRatio[] = ['16:9', '9:16', '4:3', '3:4', '1:1'];

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    formData, 
    onFormChange, 
    onGenerate, 
    isLoading, 
    scriptStats,
    enableImageGeneration,
    setEnableImageGeneration,
    onSuggestScenes,
    isSuggestingScenes
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const scriptContent = readEvent.target?.result as string;
        onFormChange('script', scriptContent);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };
    
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col gap-8">
      <InputSection number={1} title="Provide Content">
        <div className="flex border-b border-slate-600 mb-4">
          <button className="py-2 px-4 text-sm font-medium text-white border-b-2 border-blue-500">From Script</button>
          <button className="py-2 px-4 text-sm font-medium text-slate-400 hover:text-white">From Prompts</button>
        </div>
        <div className="relative">
          <textarea
            value={formData.script}
            onChange={(e) => onFormChange('script', e.target.value)}
            placeholder="Paste your script here, or upload a file. The AI will create a prompt for each paragraph or logical scene."
            className="w-full h-40 bg-slate-900 border border-slate-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
          />
          <div className="absolute bottom-2 right-2 flex gap-3 text-xs text-slate-400">
            <span>{scriptStats.words} words</span>
            <span>{scriptStats.chars} chars</span>
            <span>{scriptStats.scenes} scenes</span>
          </div>
        </div>
        <label htmlFor="script-upload" className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <UploadIcon />
          Upload Script File (.txt)
        </label>
        <input id="script-upload" type="file" accept=".txt" className="hidden" onChange={handleFileChange} />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2"><HashIcon /> Number of Scenes</label>
            <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.numScenes}
                  onChange={(e) => onFormChange('numScenes', e.target.value)}
                  placeholder="e.g., 5"
                  className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button 
                  onClick={onSuggestScenes}
                  disabled={isSuggestingScenes || !formData.script.trim()}
                  className="px-3 bg-slate-700 hover:bg-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Suggest number of scenes based on script"
                >
                  {isSuggestingScenes ? 
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg> : <SparklesIcon className="w-5 h-5 text-yellow-400" />
                  }
                </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Optional. AI will decide if left blank.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2"><TagIcon /> Niche / Topic</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => onFormChange('niche', e.target.value)}
              placeholder="e.g., futuristic gadgets"
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Optional. Provides context to the AI.</p>
          </div>
        </div>
      </InputSection>

      <InputSection number={2} title="Define Image Style">
        <div>
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2"><ImageIcon /> Reference Image (Optional)</label>
          <ImageUploader
            referenceImage={formData.referenceImage}
            setReferenceImage={(value) => onFormChange('referenceImage', value)}
          />
           <p className="text-xs text-slate-500 mt-1">Upload an image to automatically analyze and apply its style.</p>
        </div>
        <div className="mt-4">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2"><SparklesIcon /> Style Keywords</label>
             <input
              type="text"
              value={formData.styleKeywords}
              onChange={(e) => onFormChange('styleKeywords', e.target.value)}
              placeholder="e.g. cinematic, photorealistic, 4k"
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
             <p className="text-xs text-slate-500 mt-1">Add keywords to combine with the reference style.</p>
        </div>
      </InputSection>
      
      <InputSection number={3} title={
        <span className="flex items-center gap-2">
          <AspectRatioIcon />
          Aspect Ratio
        </span>
      }>
        <div className="grid grid-cols-5 gap-2">
            {aspectRatios.map(ratio => (
                <button
                    key={ratio}
                    onClick={() => onFormChange('aspectRatio', ratio)}
                    className={`py-2.5 px-2 rounded-md text-sm font-semibold transition-colors ${formData.aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                    {ratio}
                </button>
            ))}
        </div>
      </InputSection>

      <InputSection number={4} title={
        <span className="flex items-center gap-2">
          <SettingsIcon />
          Output Settings
        </span>
      }>
        <div className="bg-slate-900 border border-slate-700 rounded-md p-3 flex items-center justify-between">
            <label htmlFor="enable-image-gen" className="text-sm font-medium text-slate-300 cursor-pointer">
                Enable Image Generation
            </label>
            <button
                role="switch"
                aria-checked={enableImageGeneration}
                id="enable-image-gen"
                onClick={() => setEnableImageGeneration(!enableImageGeneration)}
                className={`${enableImageGeneration ? 'bg-blue-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
            >
                <span className={`${enableImageGeneration ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
        </div>
      </InputSection>
      
      <button 
        onClick={onGenerate}
        disabled={isLoading || !formData.script.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-lg"
      >
        {isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
            </>
        ) : (
            <>Generate Prompts &raquo;</>
        )}
      </button>
    </div>
  );
};