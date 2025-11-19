
import React from 'react';
import { FormData, AspectRatio, ScriptStats, AppStatus, GenerationSettings, VisualStyle } from '../types';
import { InputSection } from './InputSection';
import { ImageUploader } from './ImageUploader';
import { UploadIcon, ImageIcon, SparklesIcon, CameraIcon } from './Icons';

interface ControlPanelProps {
  formData: FormData;
  onFormChange: (field: keyof FormData, value: any) => void;
  onGenerate: () => void;
  appStatus: AppStatus;
  scriptStats: ScriptStats;
  onSuggestScenes: () => void;
  isSuggestingScenes: boolean;
  settings: GenerationSettings;
  onSettingsChange: (field: keyof GenerationSettings, value: any) => void;
  dailyImageCount: number;
}

const aspectRatios: AspectRatio[] = ['16:9', '9:16', '4:3', '3:4', '1:1'];
const visualStyles: VisualStyle[] = ['cinematic', 'realistic', 'anime', 'CGI', 'medieval', 'historical', 'documentary'];

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    formData, 
    onFormChange, 
    onGenerate, 
    appStatus, 
    scriptStats,
    onSuggestScenes,
    isSuggestingScenes,
    settings,
    onSettingsChange,
    dailyImageCount
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
    <div className="bg-[#0f111a] p-6 rounded-xl border border-slate-800 flex flex-col gap-6 shadow-xl">
      
      {/* Section 1: Provide Content */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">1</div>
            <h2 className="text-lg font-semibold text-white">Provide Content</h2>
        </div>

        {/* Tabs visual */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg mb-3 border border-slate-800">
            <button className="flex-1 py-1.5 text-sm font-medium bg-blue-600 text-white rounded shadow-sm transition-all">From Script</button>
            <button className="flex-1 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-300 transition-all cursor-not-allowed">From Prompts</button>
        </div>

        {/* Script Input */}
        <div className="relative group">
          <div className="flex justify-between text-[10px] text-slate-500 mb-1 px-1 uppercase tracking-wider font-semibold">
             <span>Input Script</span>
             <div className="flex gap-3">
                <span>{scriptStats.words} words</span>
                <span>{scriptStats.chars} chars</span>
                <span>{scriptStats.scenes} scenes</span>
             </div>
          </div>
          <textarea
            value={formData.script}
            onChange={(e) => onFormChange('script', e.target.value)}
            placeholder="Paste your script here..."
            className="w-full h-40 bg-[#1a1d2b] border border-slate-700 rounded-lg p-3 text-sm text-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none placeholder-slate-600 transition-all custom-scrollbar"
          />
        </div>

        {/* Upload Button */}
        <label htmlFor="script-upload" className="mt-3 w-full bg-[#1e2235] hover:bg-[#252a40] border border-slate-700 text-slate-300 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all text-sm">
          <UploadIcon className="w-4 h-4" />
          Upload Script File (.txt, .docx)
        </label>
        <input id="script-upload" type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
        
        {/* Scenes & Niche Row */}
        <div className="mt-4 grid grid-cols-2 gap-3">
             <div>
                <label className="text-xs font-medium text-slate-400 block mb-1 flex items-center gap-1">
                    <span className="text-blue-400">≡</span> Number of Scenes
                </label>
                <div className="relative">
                    <input
                    type="number"
                    value={formData.numScenes}
                    onChange={(e) => onFormChange('numScenes', e.target.value)}
                    placeholder="Auto"
                    className="w-full bg-[#1a1d2b] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                     <button 
                        onClick={onSuggestScenes}
                        disabled={isSuggestingScenes || !formData.script}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 disabled:opacity-30"
                        title="AI Suggest Count"
                    >
                        {isSuggestingScenes ? '...' : '✨'}
                    </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Optional. AI decides if blank.</p>
             </div>
             <div>
                <label className="text-xs font-medium text-slate-400 block mb-1 flex items-center gap-1">
                     <span className="text-blue-400">□</span> Niche / Topic
                </label>
                <input
                type="text"
                value={formData.niche}
                onChange={(e) => onFormChange('niche', e.target.value)}
                placeholder="e.g. History"
                className="w-full bg-[#1a1d2b] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-600 mt-1">Optional context.</p>
             </div>
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* Section 2: Define Image Style */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</div>
            <h2 className="text-lg font-semibold text-white">Define Image Style</h2>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 mb-1 block">Reference Image (Optional)</label>
          <ImageUploader
            referenceImage={formData.referenceImage}
            setReferenceImage={(value) => onFormChange('referenceImage', value)}
          />
          <p className="text-[10px] text-slate-600 mt-1">Upload an image to automatically analyze and apply its style.</p>
        </div>
        
        <div className="mt-4">
             <label className="text-xs font-medium text-slate-400 mb-1 block">Style Keywords</label>
             <input
              type="text"
              value={formData.styleKeywords}
              onChange={(e) => onFormChange('styleKeywords', e.target.value)}
              placeholder="e.g. cinematic, photorealistic, 4k"
              className="w-full bg-[#1a1d2b] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
            />
             <p className="text-[10px] text-slate-600 mt-1">Add keywords to combine with the reference style.</p>
        </div>

        <div className="mt-3">
            <label className="text-xs font-medium text-slate-400 mb-1 block">Global Style Preset</label>
             <select 
                value={formData.visualStyle}
                onChange={(e) => onFormChange('visualStyle', e.target.value)}
                className="w-full bg-[#1a1d2b] border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none capitalize appearance-none"
            >
                {visualStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                ))}
            </select>
        </div>
      </section>

      <hr className="border-slate-800" />

      {/* Section 3: Aspect Ratio */}
      <section>
        <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">3</div>
            <h2 className="text-lg font-semibold text-white">Aspect Ratio</h2>
        </div>
        <div className="grid grid-cols-5 gap-2 bg-[#1a1d2b] p-1 rounded-lg border border-slate-700">
            {aspectRatios.map(ratio => (
                <button
                    key={ratio}
                    onClick={() => onFormChange('aspectRatio', ratio)}
                    className={`py-2 px-1 rounded-md text-xs font-medium transition-all ${formData.aspectRatio === ratio ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                    {ratio}
                </button>
            ))}
        </div>
      </section>

      {/* Settings & Usage Toggle */}
      <div className="bg-[#151722] rounded-lg p-3 border border-slate-700/50">
          
          {/* Usage Stat */}
          <div className="flex justify-between items-center mb-3 text-xs">
             <span className="text-slate-400">Images Generated Today:</span>
             <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-800/30">{dailyImageCount}</span>
          </div>

          {/* Toggle */}
          <button 
            onClick={() => onSettingsChange('generateImages', !settings.generateImages)}
            className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${settings.generateImages 
                ? 'bg-green-900/20 border-green-800/50' 
                : 'bg-red-900/10 border-red-800/30'}`}
          >
             <span className={`text-xs font-bold ${settings.generateImages ? 'text-green-400' : 'text-red-400'}`}>
                 {settings.generateImages ? '● Image Generation ON' : '○ Image Generation OFF'}
             </span>
             <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.generateImages ? 'bg-green-600' : 'bg-slate-600'}`}>
                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow ${settings.generateImages ? 'left-4.5 translate-x-0' : 'left-0.5'}`}></div>
             </div>
          </button>
          
          {!settings.generateImages && (
              <p className="text-[10px] text-slate-500 mt-1.5 text-center">Prompts will be generated, but the Green Button for images will be hidden.</p>
          )}
      </div>

      <button 
        onClick={onGenerate}
        disabled={appStatus === 'generatingPrompts' || appStatus === 'generatingImages' || !formData.script.trim()}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-md shadow-lg shadow-blue-900/20 mt-2"
      >
        {appStatus === 'generatingPrompts' ? (
            <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Processing...</span>
            </>
        ) : (
            <>
                <span>Generate Prompts</span>
                <span className="text-lg">»</span>
            </>
        )}
      </button>
    </div>
  );
};
