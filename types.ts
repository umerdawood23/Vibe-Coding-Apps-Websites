
export type AspectRatio = '16:9' | '9:16' | '4:3' | '3:4' | '1:1';

export type VisualStyle = 'cinematic' | 'realistic' | 'anime' | 'cgi' | 'medieval' | 'historical' | 'documentary' | 'cyberpunk';

export interface ReferenceImage {
  file: File;
  base64: string;
}

export interface FormData {
  script: string;
  numScenes: string;
  niche: string;
  referenceImage: ReferenceImage | null;
  visualStyle: VisualStyle;
  styleKeywords: string;
  aspectRatio: AspectRatio;
}

export interface ScriptStats {
    words: number;
    chars: number;
    scenes: number;
}

export type AppStatus = 'idle' | 'generatingPrompts' | 'generatingImages' | 'completed' | 'error';

export interface Scene {
  id: number;
  title: string;
  description: string;
  camera_angle: string;
  lighting: string;
  visual_prompt: string;
  generate_image: boolean;
}

export interface ScriptData {
  script: string;
  characters: Record<string, string>;
  style: string;
  scenes: Scene[];
}

export interface ImageGenerationJob {
    id: string;
    sceneId: number;
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
