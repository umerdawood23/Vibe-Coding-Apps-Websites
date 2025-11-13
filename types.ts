
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
