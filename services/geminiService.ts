
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, AspectRatio, ScriptData } from '../types';

// Schema for the VEO ScriptMaster output
const scriptDataSchema = {
  type: Type.OBJECT,
  properties: {
    script: { type: Type.STRING, description: "The full generated script or summary." },
    characters: { 
      type: Type.OBJECT, 
      description: "Key characters and their consistent visual descriptions.",
      properties: {}, // Allow any keys (character names)
    },
    style: { type: Type.STRING, description: "The applied global visual style." },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          camera_angle: { type: Type.STRING },
          lighting: { type: Type.STRING },
          visual_prompt: { type: Type.STRING, description: "Detailed, cinematic image prompt." },
          generate_image: { type: Type.BOOLEAN }
        },
        required: ["id", "title", "description", "camera_angle", "lighting", "visual_prompt", "generate_image"]
      }
    }
  },
  required: ["script", "scenes", "style"]
};

export const generatePromptsFromScript = async (formData: FormData): Promise<ScriptData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  if (!formData.script.trim()) {
    throw new Error("Content cannot be empty.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  const { script, niche, visualStyle, styleKeywords, aspectRatio, numScenes, referenceImage } = formData;

  const systemInstruction = `
You are VEO ScriptMaster, an AI expert in creating long-form visual scripts and cinematic image prompts.

**CORE RESPONSIBILITIES:**
1. **Script Generation**: Analyze the input text. If it's a topic, write a script. If it's a script, analyze and structure it.
2. **Scene Breakdown**: Break the content into distinct scenes. ${numScenes ? `Target approximately ${numScenes} scenes.` : "Auto-detect logical scenes."}
3. **Visual Prompts**: Create detailed, VEO-ready image prompts for each scene.
4. **Consistency**: Maintain strict character and style consistency across all prompts.

**STYLE CONFIGURATION:**
- Global Style: ${visualStyle}
- Additional Keywords: ${styleKeywords || 'None'}
- Aspect Ratio: ${aspectRatio}

**RULES:**
- Prompts must be long, detailed, and cinematic. Include camera angles and lighting.
- Do not invent historical facts if the topic is historical.
- Set "generate_image" to true for key visual scenes.
- Return output strictly in the specified JSON format.
  `;

  const userPrompt = `
INPUT CONTENT:
---
${script}
---
CONTEXT:
- Niche: ${niche || 'General'}
- Reference Image Provided: ${referenceImage ? "YES (See attached)" : "NO"}

Generate the JSON plan.
`;

  const parts: any[] = [{ text: userPrompt }];

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
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scriptDataSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text generated.");
    
    return JSON.parse(text) as ScriptData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate script plan. Please check the console for details.");
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
  
  // Append aspect ratio to prompt text for clarity, though the config handles the actual size
  const fullPrompt = `${prompt} --ar ${aspectRatio}`;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
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
  const prompt = `Read the following script/content and determine an optimal number of distinct visual scenes for a video/slideshow. Respond with ONLY the integer number. Content: ${script.substring(0, 2000)}...`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const count = parseInt(response.text.trim(), 10);
    if (isNaN(count)) {
      return "10"; // Fallback
    }
    return String(count);
  } catch (error) {
    console.error("Error suggesting scenes:", error);
    return "";
  }
};

// Helper to build prompt just for UI display purposes if needed, 
// though now the real prompt is hidden in the system instruction.
export const buildPrompt = (formData: FormData): string => {
    return `System: You are VEO ScriptMaster.\nTask: Generate JSON script plan.\nStyle: ${formData.visualStyle} ${formData.styleKeywords}\nInput: ${formData.script.substring(0, 100)}...`;
}
