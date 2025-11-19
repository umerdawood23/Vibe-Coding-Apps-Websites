
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { OutputPanel } from './components/OutputPanel';
import { Header } from './components/Header';
import { generatePromptsFromScript, generateImageFromPrompt, suggestSceneCount } from './services/geminiService';
import { FormData, AppStatus, ImageGenerationJob, GenerationSettings, ScriptData } from './types';

const defaultSettings: GenerationSettings = {
  waitTimeMode: 'fixed',
  fixedWaitTime: 2,
  randomWaitTimeMin: 2,
  randomWaitTimeMax: 5,
  autoDownload: false,
  runsPerPrompt: 1,
  startFromPrompt: 1,
  generateImages: true, // Determines if the "green button" capability is available
};

function App() {
  const [formData, setFormData] = useState<FormData>({
    script: '',
    numScenes: '',
    niche: '',
    referenceImage: null,
    styleKeywords: '',
    visualStyle: 'cinematic',
    aspectRatio: '16:9',
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(defaultSettings);
  
  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSuggestingScenes, setIsSuggestingScenes] = useState<boolean>(false);
  
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [imageJobs, setImageJobs] = useState<ImageGenerationJob[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  
  // Daily Limit Counter State
  const [dailyImageCount, setDailyImageCount] = useState<number>(0);

  // Initialize Usage Tracker
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const storageKey = `veo_usage_${today}`;
    const storedCount = localStorage.getItem(storageKey);
    if (storedCount) {
        setDailyImageCount(parseInt(storedCount, 10));
    } else {
        // Clean up old keys if needed, or just set 0
        setDailyImageCount(0);
    }
  }, []);

  const incrementDailyCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `veo_usage_${today}`;
    const newCount = dailyImageCount + 1;
    setDailyImageCount(newCount);
    localStorage.setItem(storageKey, newCount.toString());
  };

  const handleFormChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSettingsChange = useCallback((field: keyof GenerationSettings, value: any) => {
    setGenerationSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerateScriptPlan = useCallback(async () => {
    setAppStatus('generatingPrompts');
    setError(null);
    setScriptData(null);
    setImageJobs([]);
    setCurrentJobIndex(0);
    
    try {
      const result = await generatePromptsFromScript(formData);
      setScriptData(result);
      
      // Prepare the image jobs based on the setting, but DO NOT start them yet.
      // Even if generation is disabled, we prepare the jobs structure so the list exists
      // but the button will be conditional in output panel or settings.
      // However, strictly based on the prompt: if toggled off, maybe we shouldn't even prepare them?
      // The logic in OutputPanel checks "if (imageJobs.length > 0)".
      
      if (generationSettings.generateImages) {
          const jobs: ImageGenerationJob[] = [];
          const { scenes } = result;
          const runs = Math.max(1, generationSettings.runsPerPrompt);

          scenes.forEach(scene => {
              // Even if the scene doesn't explicitly say "generate_image" (from AI), 
              // if the user enabled global generation, we likely want to allow it.
              // However, we'll respect the AI's "generate_image" flag if present to avoid non-visual scenes.
              if (scene.generate_image) {
                  for (let i = 0; i < runs; i++) {
                      jobs.push({
                          sceneId: scene.id,
                          prompt: scene.visual_prompt,
                          status: 'pending',
                          id: `${scene.id}-${i}`
                      });
                  }
              }
          });
          setImageJobs(jobs);
      }

      setAppStatus('idle'); // Ready for next step
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'An unknown error occurred.');
      setAppStatus('error');
      console.error(e);
    }
  }, [formData, generationSettings.generateImages, generationSettings.runsPerPrompt]);

  const handleGenerateImages = useCallback(() => {
    if (!scriptData) return;
    if (imageJobs.length === 0) {
        alert("No scenes were identified for image generation. Ensure 'Image Generation' is enabled and try generating prompts again.");
        return;
    }
    setCurrentJobIndex(0);
    setAppStatus('generatingImages');
  }, [scriptData, imageJobs.length]);


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
      if (appStatus === 'generatingImages' && imageJobs.length > 0 && currentJobIndex >= imageJobs.length) {
        setAppStatus('completed');
      }
      return;
    }

    let isCancelled = false;
    const currentJob = imageJobs[currentJobIndex];

    // Skip if already processed (safety check)
    if (currentJob.status !== 'pending') {
        setCurrentJobIndex(prev => prev + 1);
        return;
    }

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
        
        // Update usage count
        incrementDailyCount();

        if (autoDownload && imageUrl) {
            downloadImage(imageUrl, `scene_${currentJob.sceneId}.jpg`);
        }
      } catch (e) {
        if (isCancelled) return;
        const err = e as Error;
        const errorMessage = err.message || 'An unknown error occurred.';

        setImageJobs(prevJobs => prevJobs.map((job, index) =>
          index === currentJobIndex ? { ...job, status: 'error', error: errorMessage } : job
        ));

        if (errorMessage.toLowerCase().includes('quota exceeded')) {
            setError('Image generation stopped: Your daily free quota has been exceeded.');
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
      alert("Please provide content first.");
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

  const downloadScriptJson = () => {
    if(!scriptData) return;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(scriptData, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = "veo_script_master_plan.json";
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
        downloadImage(job.imageUrl!, `scene_${job.sceneId}.jpg`);
        i++;
        setTimeout(downloadNext, 300); // Stagger downloads
      }
    }
    downloadNext();
  };

  return (
    <div className="min-h-screen bg-[#090b10] font-sans p-4 sm:p-6 text-gray-300">
      <div className="max-w-[1600px] mx-auto">
        <Header />
        <main className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Control Panel - 4 Columns */}
          <div className="lg:col-span-4 xl:col-span-3">
            <ControlPanel
              formData={formData}
              onFormChange={handleFormChange}
              onGenerate={handleGenerateScriptPlan}
              appStatus={appStatus}
              scriptStats={scriptStats}
              onSuggestScenes={handleSuggestScenes}
              isSuggestingScenes={isSuggestingScenes}
              settings={generationSettings}
              onSettingsChange={handleSettingsChange}
              dailyImageCount={dailyImageCount}
            />
          </div>
          {/* Output Panel - 8 Columns */}
          <div className="lg:col-span-8 xl:col-span-9">
            <OutputPanel
              appStatus={appStatus}
              error={error}
              scriptData={scriptData}
              imageJobs={imageJobs}
              onDownloadScript={downloadScriptJson}
              onDownloadAllImages={downloadAllImages}
              onGenerateImages={handleGenerateImages}
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
