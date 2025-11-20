
import React, { useState } from 'react';
import { AppStatus, ImageGenerationJob, ScriptData, Scene } from '../types';
import { ImageIcon, DownloadIcon, CameraIcon, SparklesIcon } from './Icons';

interface OutputPanelProps {
  appStatus: AppStatus;
  error: string | null;
  scriptData: ScriptData | null;
  imageJobs: ImageGenerationJob[];
  onDownloadScript: () => void;
  onDownloadAllImages: () => void;
  onGenerateImages: () => void;
  currentJobIndex: number;
  totalJobs: number;
}

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[600px]">
        <div className="w-24 h-24 mb-6 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
             <ImageIcon className="w-10 h-10 opacity-50" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-300 mb-2">Your generated content will appear here</h3>
        <p className="text-slate-500 max-w-xs">Fill in the details on the left and click "Generate Prompts" to start.</p>
    </div>
);

const PromptCard: React.FC<{ scene: Scene }> = ({ scene }) => {
    return (
        <div className="group bg-[#1a1d2b] border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                     <span className="text-blue-500 font-mono text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded">SCENE {scene.id}</span>
                     <span className="text-slate-400 text-xs font-medium flex items-center gap-1"><CameraIcon className="w-3 h-3"/> {scene.camera_angle}</span>
                </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed font-light">{scene.visual_prompt}</p>
            <div className="mt-3 pt-3 border-t border-slate-800/50 flex justify-between items-center opacity-50 group-hover:opacity-100 transition-opacity">
                 <span className="text-[10px] text-slate-500 uppercase tracking-wide">{scene.lighting}</span>
            </div>
        </div>
    )
}

const ImageResultCard: React.FC<{ job: ImageGenerationJob }> = ({ job }) => {
    if (!job) return null;
    
    return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg group">
            {job.status === 'completed' && job.imageUrl ? (
                <>
                    <img src={job.imageUrl} alt={`Scene ${job.sceneId}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={job.imageUrl} download={`scene_${job.sceneId}.jpg`} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <DownloadIcon className="w-4 h-4" /> Download
                        </a>
                    </div>
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">Scene {job.sceneId}</span>
                </>
            ) : job.status === 'error' ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-2">
                    <span className="text-red-400 text-xs font-bold mb-1">Failed</span>
                    <span className="text-red-500 text-[10px] leading-tight">{job.error}</span>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full bg-[#151722]">
                     <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-slate-500 text-xs">Rendering...</span>
                </div>
            )}
        </div>
    )
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
    appStatus, 
    error,
    scriptData,
    imageJobs,
    onDownloadScript,
    onDownloadAllImages,
    onGenerateImages,
    currentJobIndex,
    totalJobs,
}) => {
    const [copied, setCopied] = useState(false);

    const handleDownloadPrompts = () => {
        if (!scriptData) return;
        // Clean format for text file - Just the prompts, separated by paragraphs.
        // Removed [Scene X] headers to prevent parsing issues in other tools.
        const text = scriptData.scenes.map(s => s.visual_prompt).join('\n\n');
        
        const element = document.createElement("a");
        const file = new Blob([text], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "veo_prompts.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleCopyAll = () => {
        if (!scriptData) return;
        const text = scriptData.scenes.map(s => s.visual_prompt).join('\n\n');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (appStatus === 'idle' && !scriptData) return <Placeholder />;

    return (
        <div className="bg-[#0f111a] rounded-xl border border-slate-800 h-[850px] flex flex-col shadow-xl overflow-hidden">
             {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                
                {error && (
                     <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-200 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Section: Generated Prompts */}
                {scriptData && (
                    <section className="animate-fadeIn">
                         <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0f111a]/95 backdrop-blur py-2 z-10 border-b border-slate-800/50">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                Generated Prompts 
                                <span className="bg-slate-800 text-slate-400 text-xs py-0.5 px-2 rounded-full border border-slate-700">{scriptData.scenes.length}</span>
                            </h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCopyAll}
                                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-slate-600"
                                >
                                    {copied ? "Copied!" : "Copy All"}
                                </button>
                                <button onClick={handleDownloadPrompts} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                                    <DownloadIcon className="w-3 h-3" /> .txt
                                </button>
                            </div>
                        </div>
                        
                        {appStatus === 'generatingPrompts' ? (
                             <div className="space-y-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="h-24 bg-[#1a1d2b] rounded-lg animate-pulse border border-slate-800"></div>
                                ))}
                             </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {scriptData.scenes.map((scene) => (
                                    <PromptCard key={scene.id} scene={scene} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
                
                {/* Section: Action Button (Green) */}
                {scriptData && appStatus !== 'generatingPrompts' && imageJobs.length > 0 && (
                     <div className="py-4 border-t border-slate-800/50 sticky top-[50px] z-10 bg-[#0f111a]">
                         <button 
                            onClick={onGenerateImages}
                            disabled={appStatus === 'generatingImages' || imageJobs.every(j => j.status === 'completed')}
                            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all"
                         >
                            {appStatus === 'generatingImages' ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Generating Images ({currentJobIndex + 1}/{totalJobs})...
                                </>
                            ) : imageJobs.every(j => j.status === 'completed') ? (
                                <span>✓ Generation Complete</span>
                            ) : (
                                <>
                                    <span>Start Image Generation</span>
                                    <span>»</span>
                                </>
                            )}
                         </button>
                     </div>
                )}

                {/* Section: Generated Images */}
                {(appStatus === 'generatingImages' || imageJobs.some(j => j.status !== 'pending')) && (
                    <section className="animate-fadeIn border-t border-slate-800 pt-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Generated Images</h3>
                            {imageJobs.some(j => j.status === 'completed') && (
                                <button onClick={onDownloadAllImages} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-slate-600">
                                    <DownloadIcon className="w-3 h-3" /> Download All
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {imageJobs.map((job) => (
                                <ImageResultCard key={job.id} job={job} />
                            ))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
};
