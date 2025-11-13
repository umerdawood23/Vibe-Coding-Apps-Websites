import React from 'react';
import { AppStatus, ImageGenerationJob } from '../types';
import { ImageIcon, DownloadIcon } from './Icons';

interface OutputPanelProps {
  appStatus: AppStatus;
  error: string | null;
  aiRequestPrompt: string;
  prompts: string[];
  imageJobs: ImageGenerationJob[];
  onDownloadPrompts: () => void;
  onDownloadAllImages: () => void;
  currentJobIndex: number;
  totalJobs: number;
}

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <ImageIcon className="w-16 h-16 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300">Your generated content will appear here</h3>
        <p className="mt-1">Fill in the details on the left and click "Generate" to start.</p>
    </div>
);

const LoadingIndicator = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <h3 className="text-xl font-semibold text-slate-300">{text}</h3>
        <p className="mt-1 text-slate-400">The AI is working its magic. Please wait.</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
        <p className="mt-2 bg-red-900/50 border border-red-700 rounded-md p-3 text-red-300">{message}</p>
    </div>
);

const ImageJobItem: React.FC<{ job: ImageGenerationJob }> = ({ job }) => {
    return (
        <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center relative border border-slate-700 overflow-hidden">
            {job.status === 'generating' && (
                <div className="flex flex-col items-center justify-center text-slate-400">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </div>
            )}
            {job.status === 'completed' && job.imageUrl && (
                <img src={job.imageUrl} alt={job.prompt} className="w-full h-full object-cover" />
            )}
            {job.status === 'error' && (
                 <div className="p-2 text-center text-xs text-red-400">{job.error || 'Failed'}</div>
            )}
             {job.status === 'pending' && (
                 <div className="p-2 text-center text-xs text-slate-500">Waiting...</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5 text-xs text-white truncate">{job.prompt.replace(/^\d+\.\s*/, '')}</div>
        </div>
    )
}


export const OutputPanel: React.FC<OutputPanelProps> = ({ 
    appStatus, 
    error,
    aiRequestPrompt,
    prompts,
    imageJobs,
    onDownloadPrompts,
    onDownloadAllImages,
    currentJobIndex,
    totalJobs,
}) => {
    
    const renderContent = () => {
        if (appStatus === 'idle' && prompts.length === 0) return <Placeholder />;
        if (appStatus === 'generatingPrompts') return <LoadingIndicator text="Generating Prompts..." />;
        if (appStatus === 'error') return <ErrorDisplay message={error!} />;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Left Column */}
                <div className="flex flex-col gap-4 min-h-0">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">AI Request for Prompts</h3>
                        <textarea
                            readOnly
                            value={aiRequestPrompt}
                            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-md p-3 text-xs text-slate-400 resize-none"
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-white">Generated Prompts ({prompts.length})</h3>
                            <button onClick={onDownloadPrompts} className="flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md">
                                <DownloadIcon className="w-4 h-4" />
                                .txt
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-700 rounded-md p-3">
                            <ul className="space-y-2">
                                {prompts.map((prompt, index) => (
                                    <li key={index} className="text-sm text-slate-300">{prompt}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col min-h-0">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-white">Generated Images</h3>
                        <button onClick={onDownloadAllImages} disabled={appStatus !== 'completed'} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-3 py-1.5 rounded-md">
                           <DownloadIcon className="w-4 h-4" />
                            Download All
                        </button>
                    </div>
                     {appStatus === 'generatingImages' && (
                        <p className="text-sm text-slate-400 mb-2">Generating image {Math.min(currentJobIndex + 1, totalJobs)} of {totalJobs}...</p>
                    )}
                     {appStatus === 'completed' && (
                        <p className="text-sm text-green-400 mb-2">Generation complete.</p>
                    )}
                    <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-2">
                       {imageJobs.map(job => <ImageJobItem key={job.id} job={job} />)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 min-h-[600px] lg:min-h-full flex flex-col">
            {renderContent()}
        </div>
    );
};