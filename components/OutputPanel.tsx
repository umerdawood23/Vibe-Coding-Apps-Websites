import React from 'react';
import { ImageIcon, CameraIcon } from './Icons';

interface OutputPanelProps {
  prompts: string;
  isLoading: boolean;
  error: string | null;
  generatedImage: string | null;
  isGeneratingImage: boolean;
  imageError: string | null;
  onGenerateImage: (prompt: string) => void;
  activePrompt: string | null;
  enableImageGeneration: boolean;
}

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <ImageIcon className="w-16 h-16 mb-4" />
        <h3 className="text-xl font-semibold text-slate-300">Your generated content will appear here</h3>
        <p className="mt-1">Fill in the details on the left and click "Generate Prompts" to start.</p>
    </div>
);

const LoadingIndicator = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-xl font-semibold text-slate-300">Generating Prompts...</h3>
        <p className="mt-1 text-slate-400">The AI is working its magic. Please wait.</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
        <p className="mt-2 bg-red-900/50 border border-red-700 rounded-md p-3 text-red-300">{message}</p>
    </div>
);

const ImageLoadingIndicator = ({ prompt }: { prompt: string | null }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-4">
        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h3 className="text-lg font-semibold text-slate-300">Generating Image...</h3>
        {prompt && <p className="mt-2 text-sm max-w-md truncate">For: "{prompt}"</p>}
    </div>
);

const ImageErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-lg font-semibold text-red-400">Image Generation Failed</h3>
        <p className="mt-2 bg-red-900/50 border border-red-700 rounded-md p-3 text-red-300 text-sm">{message}</p>
    </div>
);

const ImagePlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-600">
        <ImageIcon className="w-12 h-12 mb-3" />
        <h3 className="font-semibold text-slate-400">Generated image will appear here</h3>
        <p className="text-sm">Select a prompt below to generate.</p>
    </div>
);


export const OutputPanel: React.FC<OutputPanelProps> = ({ 
    prompts, 
    isLoading, 
    error,
    generatedImage,
    isGeneratingImage,
    imageError,
    onGenerateImage,
    activePrompt,
    enableImageGeneration
}) => {
    
    const promptList = prompts.trim().split('\n').filter(line => line.trim().match(/^\d+\./));

    const renderContent = () => {
        if (isLoading) return <LoadingIndicator />;
        if (error) return <ErrorDisplay message={error} />;
        if (!prompts) return <Placeholder />;
        
        if (!enableImageGeneration) {
            return (
                <div className="flex flex-col h-full w-full">
                     <h3 className="text-lg font-semibold mb-3 text-white">Generated Prompts (Image Generation Disabled)</h3>
                     <div className="flex-1 overflow-y-auto pr-2 bg-slate-900 border border-slate-700 rounded-md p-4">
                        <ul className="space-y-3">
                            {promptList.map((prompt, index) => (
                                <li key={index} className="text-sm text-slate-300">{prompt}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )
        }

        return (
            <div className="flex flex-col h-full w-full">
                <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative mb-4 border border-slate-700">
                    {isGeneratingImage ? <ImageLoadingIndicator prompt={activePrompt} /> :
                     imageError ? <ImageErrorDisplay message={imageError} /> :
                     generatedImage ? <img src={generatedImage} alt="Generated from prompt" className="object-contain w-full h-full rounded-lg" /> :
                     <ImagePlaceholder />}
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <h3 className="text-lg font-semibold mb-3 text-white">Generated Prompts</h3>
                    <ul className="space-y-3">
                        {promptList.map((prompt, index) => (
                            <li key={index} className="bg-slate-900/70 p-3 rounded-md flex justify-between items-start gap-3 border border-slate-700">
                                <p className="text-sm text-slate-300 flex-1">{prompt}</p>
                                <button
                                    onClick={() => onGenerateImage(prompt)}
                                    disabled={isGeneratingImage}
                                    className="p-2 rounded-full bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Generate image for this prompt"
                                >
                                    {isGeneratingImage && activePrompt === prompt ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    ) : <CameraIcon />}
                                </button>
                            </li>
                        ))}
                    </ul>
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