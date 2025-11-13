import React, { useState, useCallback, useMemo } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { generatePromptsFromScript, generateImageFromPrompt, suggestSceneCount } from './services/geminiService';
import { FormData, AspectRatio } from './types';

function App() {
  const [formData, setFormData] = useState<FormData>({
    script: '',
    numScenes: '',
    niche: '',
    referenceImage: null,
    styleKeywords: '',
    aspectRatio: '16:9',
  });
  const [generatedPrompts, setGeneratedPrompts] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const [enableImageGeneration, setEnableImageGeneration] = useState<boolean>(true);
  const [isSuggestingScenes, setIsSuggestingScenes] = useState<boolean>(false);


  const handleFormChange = useCallback((field: keyof FormData, value: string | { file: File; base64: string } | null | AspectRatio) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedPrompts('');
    setGeneratedImage(null);
    setImageError(null);
    setActivePrompt(null);

    try {
      const result = await generatePromptsFromScript(formData);
      setGeneratedPrompts(result);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  const handleGenerateImage = useCallback(async (prompt: string) => {
    setIsGeneratingImage(true);
    setImageError(null);
    setGeneratedImage(null);
    setActivePrompt(prompt);

    try {
      const result = await generateImageFromPrompt(prompt, formData.aspectRatio);
      setGeneratedImage(result);
    } catch (e) {
      const err = e as Error;
      setImageError(err.message || 'An unknown error occurred during image generation.');
      console.error(e);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [formData.aspectRatio]);

  const handleSuggestScenes = useCallback(async () => {
    if (!formData.script.trim()) {
      alert("Please provide a script first to suggest scenes.");
      return;
    }
    setIsSuggestingScenes(true);
    try {
      const count = await suggestSceneCount(formData.script);
      setFormData(prev => ({ ...prev, numScenes: count }));
    } catch (e) {
      const err = e as Error;
      alert(`Could not suggest scenes: ${err.message}`);
    } finally {
      setIsSuggestingScenes(false);
    }
  }, [formData.script]);
  
  const scriptStats = useMemo(() => {
    const words = formData.script.match(/\b\w+\b/g)?.length || 0;
    const chars = formData.script.length;
    const scenes = formData.script.split(/\n\s*\n/).filter(p => p.trim() !== '').length || 0;
    return { words, chars, scenes };
  }, [formData.script]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ControlPanel
            formData={formData}
            onFormChange={handleFormChange}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            scriptStats={scriptStats}
            enableImageGeneration={enableImageGeneration}
            setEnableImageGeneration={setEnableImageGeneration}
            onSuggestScenes={handleSuggestScenes}
            isSuggestingScenes={isSuggestingScenes}
          />
          <OutputPanel
            prompts={generatedPrompts}
            isLoading={isLoading}
            error={error}
            generatedImage={generatedImage}
            isGeneratingImage={isGeneratingImage}
            imageError={imageError}
            onGenerateImage={handleGenerateImage}
            activePrompt={activePrompt}
            enableImageGeneration={enableImageGeneration}
          />
        </main>
      </div>
    </div>
  );
}

export default App;