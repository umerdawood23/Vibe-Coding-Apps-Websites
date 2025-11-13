import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { generatePromptsFromScript, generateImageFromPrompt, suggestSceneCount, buildPrompt } from './services/geminiService';
import { FormData, AspectRatio, AppStatus, ImageGenerationJob, GenerationSettings } from './types';

const defaultSettings: GenerationSettings = {
  waitTimeMode: 'fixed',
  fixedWaitTime: 5,
  randomWaitTimeMin: 5,
  randomWaitTimeMax: 15,
  autoDownload: false,
  runsPerPrompt: 1,
  startFromPrompt: 1,
};

function App() {
  const [formData, setFormData] = useState<FormData>({
    script: '',
    numScenes: '',
    niche: '',
    referenceImage: null,
    styleKeywords: '',
    aspectRatio: '16:9',
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(defaultSettings);
  
  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSuggestingScenes, setIsSuggestingScenes] = useState<boolean>(false);
  
  const [aiRequestPrompt, setAiRequestPrompt] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [imageJobs, setImageJobs] = useState<ImageGenerationJob[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  const handleFormChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSettingsChange = useCallback((field: keyof GenerationSettings, value: any) => {
    setGenerationSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    setAppStatus('generatingPrompts');
    setError(null);
    setPrompts([]);
    setImageJobs([]);
    setCurrentJobIndex(0);
    
    const requestPrompt = buildPrompt(formData);
    setAiRequestPrompt(requestPrompt);

    try {
      const result = await generatePromptsFromScript(formData);
      const generatedPrompts = result.trim().split('\n').filter(line => line.trim().match(/^\d+\./));
      setPrompts(generatedPrompts);

      if (generatedPrompts.length > 0) {
        const startPromptNum = Math.max(1, generationSettings.startFromPrompt);
        const runs = Math.max(1, generationSettings.runsPerPrompt);
        const jobs: ImageGenerationJob[] = [];
        
        for (let i = startPromptNum - 1; i < generatedPrompts.length; i++) {
          for (let j = 0; j < runs; j++) {
            jobs.push({
              prompt: generatedPrompts[i],
              status: 'pending',
              id: `${i}-${j}`
            });
          }
        }
        setImageJobs(jobs);
        setCurrentJobIndex(0);
        setAppStatus('generatingImages');
      } else {
        throw new Error("No prompts were generated from the script.");
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'An unknown error occurred.');
      setAppStatus('error');
      console.error(e);
    }
  }, [formData, generationSettings]);

  // Destructure for stable dependencies in useEffect
  const { aspectRatio } = formData;
  const { 
    waitTimeMode, 
    fixedWaitTime, 
    randomWaitTimeMin, 
    randomWaitTimeMax, 
    autoDownload 
  } = generationSettings;

  useEffect(() => {
    if (appStatus !== 'generatingImages' || currentJobIndex >= imageJobs.length) {
      if (appStatus === 'generatingImages' && imageJobs.length > 0) {
        setAppStatus('completed');
      }
      return;
    }

    let isCancelled = false;
    const currentJob = imageJobs[currentJobIndex];

    const processJob = async () => {
      setImageJobs(prevJobs => prevJobs.map((job, index) =>
        index === currentJobIndex ? { ...job, status: 'generating' } : job
      ));

      let shouldContinue = true;

      try {
        const imageUrl = await generateImageFromPrompt(currentJob.prompt, aspectRatio);
        if (isCancelled) return;

        setImageJobs(prevJobs => prevJobs.map((job, index) =>
          index === currentJobIndex ? { ...job, status: 'completed', imageUrl } : job
        ));
        if (autoDownload && imageUrl) {
            downloadImage(imageUrl, `image_${currentJobIndex + 1}.jpeg`);
        }
      } catch (e) {
        if (isCancelled) return;
        const err = e as Error;
        const errorMessage = err.message || 'An unknown error occurred.';

        setImageJobs(prevJobs => prevJobs.map((job, index) =>
          index === currentJobIndex ? { ...job, status: 'error', error: errorMessage } : job
        ));

        if (errorMessage.toLowerCase().includes('quota exceeded')) {
            setError('Image generation stopped: Your daily free quota has been exceeded. To continue generating images, please use the Gemini API.');
            setAppStatus('error');
            shouldContinue = false;
        }
      }

      if (shouldContinue && !isCancelled) {
          const delay = waitTimeMode === 'fixed'
            ? fixedWaitTime * 1000
            : (Math.random() * (randomWaitTimeMax - randomWaitTimeMin) + randomWaitTimeMin) * 1000;

          setTimeout(() => setCurrentJobIndex(prev => prev + 1), Math.max(0, delay));
      }
    };

    processJob();
    return () => { isCancelled = true; };
  }, [
    appStatus, 
    currentJobIndex, 
    imageJobs.length, 
    aspectRatio,
    autoDownload,
    waitTimeMode,
    fixedWaitTime,
    randomWaitTimeMin,
    randomWaitTimeMax
  ]);


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

  const downloadTxtFile = () => {
    const element = document.createElement("a");
    const file = new Blob([prompts.join("\n")], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "generated_prompts.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadImage = (url: string, filename: string) => {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };
    
  const downloadAllImages = () => {
    let i = 0;
    const successfulJobs = imageJobs.filter(job => job.status === 'completed' && job.imageUrl);
    function downloadNext() {
      if (i < successfulJobs.length) {
        const job = successfulJobs[i];
        downloadImage(job.imageUrl!, `prompt_${prompts.indexOf(job.prompt) + 1}_run_${job.id.split('-')[1]}.jpeg`);
        i++;
        setTimeout(downloadNext, 300); // Stagger downloads
      }
    }
    downloadNext();
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <ControlPanel
              formData={formData}
              onFormChange={handleFormChange}
              onGenerate={handleGenerate}
              appStatus={appStatus}
              scriptStats={scriptStats}
              onSuggestScenes={handleSuggestScenes}
              isSuggestingScenes={isSuggestingScenes}
              settings={generationSettings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
          <div className="lg:col-span-3">
            <OutputPanel
              appStatus={appStatus}
              error={error}
              aiRequestPrompt={aiRequestPrompt}
              prompts={prompts}
              imageJobs={imageJobs}
              onDownloadPrompts={downloadTxtFile}
              onDownloadAllImages={downloadAllImages}
              currentJobIndex={currentJobIndex}
              totalJobs={imageJobs.length}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;