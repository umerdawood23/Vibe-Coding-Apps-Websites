
import React from 'react';
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
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 min-h-[400px]">
        <ImageIcon className="w-16 h-16 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300">Your production plan will appear here</h3>
        <p className="mt-1">Provide your script or topic on the left and click "Generate Script Plan".</p>
    </div>
);

const LoadingIndicator = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
        <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <h3 className="text-xl font-semibold text-slate-300">{text}</h3>
        <p className="mt-1 text-slate-400">The AI is structuring your scenes and crafting prompts...</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 min-h-[400px]">
        <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
        <p className="mt-2 bg-red-900/50 border border-red-700 rounded-md p-3 text-red-300">{message}</p>
    </div>
);

const SceneCard: React.FC<{ 
    scene: Scene, 
    job?: ImageGenerationJob, 
    index: number 
}> = ({ scene, job, index }) => {
    return (
        <div className="bg-slate-900/80 border border-slate-700 rounded-lg overflow-hidden flex flex-col md:flex-row">
            {/* Image / Status Section */}
            <div className="w-full md:w-1/3 aspect-video bg-black/40 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-700">
                 <span className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">Scene {scene.id}</span>
                 
                 {job?.status === 'completed' && job.imageUrl ? (
                     <img src={job.imageUrl} alt={`Scene ${scene.id}`} className="w-full h-full object-cover" />
                 ) : job?.status === 'generating' ? (
                     <div className="flex flex-col items-center gap-2">
                         <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span className="text-xs text-blue-400">Rendering...</span>
                     </div>
                 ) : job?.status === 'error' ? (
                      <div className="text-center p-4">
                         <span className="text-red-400 text-sm block mb-1">Generation Failed</span>
                         <span className="text-red-500 text-xs">{job.error}</span>
                      </div>
                 ) : scene.generate_image ? (
                     <div className="text-slate-500 flex flex-col items-center">
                         <ImageIcon className="w-8 h-8 opacity-50" />
                         <span className="text-xs mt-2">Ready to Generate</span>
                     </div>
                 ) : (
                    <span className="text-slate-600 text-xs italic">No Image Requested</span>
                 )}
            </div>

            {/* Details Section */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-lg">{scene.title}</h4>
                    <div className="flex gap-2">
                        <span className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 flex items-center gap-1">
                           <CameraIcon className="w-3 h-3" /> {scene.camera_angle}
                        </span>
                         <span className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 flex items-center gap-1">
                           <SparklesIcon className="w-3 h-3" /> {scene.lighting}
                        </span>
                    </div>
                </div>
                
                <div className="text-sm text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-800">
                    <p className="line-clamp-3">{scene.description}</p>
                </div>

                <div className="mt-auto pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Prompt</p>
                    <p className="text-xs text-slate-400 font-mono line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={scene.visual_prompt}>
                        {scene.visual_prompt}
                    </p>
                </div>
            </div>
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
    
    const renderContent = () => {
        if (appStatus === 'idle' && !scriptData) return <Placeholder />;
        if (appStatus === 'generatingPrompts') return <LoadingIndicator text="Analyzing Script..." />;
        if (appStatus === 'error' && !scriptData) return <ErrorDisplay message={error || 'Unknown error'} />;

        return (
            <div className="flex flex-col h-full gap-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Production Plan</h2>
                        <p className="text-sm text-slate-400">
                            {scriptData?.scenes.length} Scenes • Style: <span className="text-blue-400 capitalize">{scriptData?.style}</span>
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                         <button onClick={onDownloadScript} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-md transition-colors">
                            <DownloadIcon className="w-4 h-4" />
                            JSON Plan
                        </button>
                        {appStatus === 'completed' && imageJobs.some(j => j.status === 'completed') ? (
                            <button onClick={onDownloadAllImages} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md transition-colors">
                                <DownloadIcon className="w-4 h-4" />
                                Images
                            </button>
                        ) : (
                             <button 
                                onClick={onGenerateImages} 
                                disabled={appStatus === 'generatingImages' || !scriptData}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold transition-colors shadow-lg shadow-blue-900/20"
                             >
                                {appStatus === 'generatingImages' ? (
                                    <>Processing {currentJobIndex + 1}/{totalJobs}...</>
                                ) : (
                                    <><ImageIcon className="w-4 h-4" /> Generate All Images</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                     {/* Script Summary */}
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                         <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Script Summary</h3>
                         <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                             {scriptData?.script}
                         </p>
                    </div>
                    
                     {/* Characters */}
                     {scriptData?.characters && Object.keys(scriptData.characters).length > 0 && (
                        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Character Guide</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Object.entries(scriptData.characters).map(([name, desc]) => (
                                    <div key={name} className="text-sm">
                                        <span className="font-bold text-blue-300 block">{name}</span>
                                        <span className="text-slate-400">{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                     )}

                    {/* Scenes List */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase sticky top-0 bg-slate-800/95 py-2 z-10 backdrop-blur-sm">Scene Breakdown</h3>
                        {scriptData?.scenes.map((scene, index) => {
                            // Find all jobs for this scene
                            const job = imageJobs.find(j => j.sceneId === scene.id);
                            return (
                                <SceneCard 
                                    key={scene.id} 
                                    scene={scene} 
                                    job={job}
                                    index={index} 
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 h-[800px] flex flex-col">
            {renderContent()}
        </div>
    );
};
