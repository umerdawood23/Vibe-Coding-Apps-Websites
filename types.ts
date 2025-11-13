export type AspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';

export interface ReferenceImage {
  file: File;
  base64: string;
}

export interface FormData {
  script: string;
  numScenes: string;
  niche: string;
  referenceImage: ReferenceImage | null;
  styleKeywords: string;
  aspectRatio: AspectRatio;
}

export interface ScriptStats {
    words: number;
    chars: number;
    scenes: number;
}

export type AppStatus = 'idle' | 'generatingPrompts' | 'generatingImages' | 'completed' | 'error';

export interface ImageGenerationJob {
    id: string;
    prompt: string;
    status: 'pending' | 'generating' | 'completed' | 'error';
    imageUrl?: string;
    error?: string;
}

export interface GenerationSettings {
    waitTimeMode: 'fixed' | 'random';
    fixedWaitTime: number;
    randomWaitTimeMin: number;
    randomWaitTimeMax: number;
    autoDownload: boolean;
    runsPerPrompt: number;
    startFromPrompt: number;
}