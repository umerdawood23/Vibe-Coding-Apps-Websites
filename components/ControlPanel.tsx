import React from 'react';
import { FormData, AspectRatio, ScriptStats, AppStatus, GenerationSettings } from '../types';
import { InputSection } from './InputSection';
import { ImageUploader } from './ImageUploader';
import { UploadIcon, HashIcon, TagIcon, ImageIcon, SparklesIcon, AspectRatioIcon, SettingsIcon } from './Icons';

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
}

const aspectRatios: AspectRatio[] = ['16:9', '9:16', '4:3', '3:4', '1:1'];

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

  const getButtonText = () => {
    switch(appStatus) {
      case 'generatingPrompts': return 'Generating Prompts...';
      case 'generatingImages': return 'Processing Images...';
      case 'completed': return 'Finished';
      default: return 'Generate';
    }
  }
    
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 flex flex-col gap-6">
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
          </div>
        </div>
        <label htmlFor="script-upload" className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <UploadIcon />
          Upload Script File (.txt)
        </label>
        <input id="script-upload" type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
        <div className="mt-4">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2"><TagIcon /> Niche / Topic (Optional)</label>
            <input
              type="text"
              value={formData.niche}
              onChange={(e) => onFormChange('niche', e.target.value)}
              placeholder="e.g., futuristic gadgets"
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
      </InputSection>

      <InputSection number={2} title="Define Image Style">
        <div>
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2"><ImageIcon /> Reference Image (Optional)</label>
          <ImageUploader
            referenceImage={formData.referenceImage}
            setReferenceImage={(value) => onFormChange('referenceImage', value)}
          />
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
        </div>
      </InputSection>
      
      <InputSection number={3} title="Aspect Ratio">
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

      <InputSection number={4} title="Generation Settings">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Wait Time Mode</label>
              <div className="flex gap-2">
                <button onClick={() => onSettingsChange('waitTimeMode', 'fixed')} className={`flex-1 py-2 rounded ${settings.waitTimeMode === 'fixed' ? 'bg-blue-600' : 'bg-slate-700'}`}>Fixed</button>
                <button onClick={() => onSettingsChange('waitTimeMode', 'random')} className={`flex-1 py-2 rounded ${settings.waitTimeMode === 'random' ? 'bg-blue-600' : 'bg-slate-700'}`}>Random</button>
              </div>
            </div>
             {settings.waitTimeMode === 'fixed' ? (
                <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Wait time (s)</label>
                    <input type="number" value={settings.fixedWaitTime} onChange={e => onSettingsChange('fixedWaitTime', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm" />
                </div>
             ) : (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2">Min (s)</label>
                        <input type="number" value={settings.randomWaitTimeMin} onChange={e => onSettingsChange('randomWaitTimeMin', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 block mb-2">Max (s)</label>
                        <input type="number" value={settings.randomWaitTimeMax} onChange={e => onSettingsChange('randomWaitTimeMax', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm" />
                    </div>
                </div>
             )}
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Runs per prompt</label>
                    <input type="number" min="1" value={settings.runsPerPrompt} onChange={e => onSettingsChange('runsPerPrompt', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-300 block mb-2">Start from prompt</label>
                    <input type="number" min="1" value={settings.startFromPrompt} onChange={e => onSettingsChange('startFromPrompt', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-sm" />
                </div>
             </div>
             <div className="flex items-center justify-between">
                <label htmlFor="auto-download" className="text-sm font-medium text-slate-300">Auto-download images</label>
                <button role="switch" aria-checked={settings.autoDownload} onClick={() => onSettingsChange('autoDownload', !settings.autoDownload)} className={`${settings.autoDownload ? 'bg-blue-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full`}>
                    <span className={`${settings.autoDownload ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
             </div>
          </div>
      </InputSection>

      <button 
        onClick={onGenerate}
        disabled={appStatus !== 'idle' || !formData.script.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-lg"
      >
        {appStatus !== 'idle' && (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
        )}
        {getButtonText()}
      </button>
    </div>
  );
};