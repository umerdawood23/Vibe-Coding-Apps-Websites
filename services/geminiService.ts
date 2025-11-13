import { GoogleGenAI } from "@google/genai";
import { FormData, AspectRatio } from '../types';

export const buildPrompt = (formData: FormData): string => {
  const { script, numScenes, niche, styleKeywords, aspectRatio, referenceImage } = formData;
  
  const baseInstruction = referenceImage
    ? `You are an expert prompt generator for AI image models. Your task is to analyze the provided reference image for its artistic style and then create a series of detailed image prompts based on a script, applying that style.`
    : `You are an expert prompt generator for AI image models. Your task is to create a series of detailed, vivid image prompts based on the provided script.`;

  const styleRequirements = referenceImage
    ? `- Analyze the style of the reference image I've provided. This includes color palette, lighting, composition, and overall mood.\n- Additional Style Keywords to combine with the image's style: ${styleKeywords || 'None'}`
    : `- Base Style Keywords: ${styleKeywords || 'cinematic, photorealistic, 4k'}`;

  return `
${baseInstruction}

**CONTEXT:**
- Script:
---
${script}
---
- Niche/Topic: ${niche || 'Not specified'}
- Number of Scenes to Generate: ${numScenes || 'Analyze the script to determine a logical number of scenes.'}

**STYLE REQUIREMENTS:**
${styleRequirements}
- Aspect Ratio: --ar ${aspectRatio}

**INSTRUCTIONS:**
1. First, ${referenceImage ? "analyze the provided reference image to understand its distinct artistic style. " : ""}Read and understand the provided script.
2. Divide the script into ${numScenes ? numScenes + ' scenes' : 'a series of logical scenes or paragraphs'}.
3. For each scene, create a single, descriptive prompt for an AI image generator.
4. The prompt should capture the key actions, characters, setting, and mood of the scene.
5. Crucially, combine the style you identified ${referenceImage ? "from the reference image with the additional 'Style Keywords' and apply this unified style" : "from the 'Style Keywords' and apply this style consistently"} to every prompt you generate.
6. Append the aspect ratio command \`--ar ${aspectRatio}\` to the end of each prompt.
7. Format the output as a numbered list of prompts. Do not include any other commentary, preamble, or explanation. Just the prompts.
  `;
};


export const generatePromptsFromScript = async (formData: FormData): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  if (!formData.script.trim()) {
    throw new Error("Script content cannot be empty.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  
  const promptText = buildPrompt(formData);
  const parts: any[] = [{ text: promptText }];

  if (formData.referenceImage) {
    const { base64, file } = formData.referenceImage;
    parts.unshift({
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: parts },
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate prompts. Please check the console for details.");
  }
};

export const generateImageFromPrompt = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty for image generation.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("Image generation failed: No image data received from API.");
    }
  } catch (error) {
    console.error("Error calling Imagen API:", error);
    const errorMessage = (error as Error).message || 'An unknown error occurred.';
    if (errorMessage.includes('filtered')) {
        throw new Error("Image generation failed due to safety filters. Please modify your prompt.");
    }
    throw new Error(`Failed to generate image. Details: ${errorMessage}`);
  }
};

export const suggestSceneCount = async (script: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const prompt = `You are a script analysis tool. Read the following script and determine the number of distinct scenes. A scene is a continuous action in a single location. A new paragraph often indicates a new scene. Respond with ONLY the integer number of scenes and no other text or explanation.\n\nSCRIPT:\n---\n${script}\n---`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const count = parseInt(response.text.trim(), 10);
    if (isNaN(count)) {
      throw new Error("AI did not return a valid number.");
    }
    return String(count);
  } catch (error) {
    console.error("Error calling Gemini API for scene suggestion:", error);
    throw new Error("Failed to suggest scene count.");
  }
};