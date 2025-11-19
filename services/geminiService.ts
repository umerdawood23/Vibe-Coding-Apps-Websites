
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FormData, AspectRatio, ScriptData, Scene, Character } from '../types';

// Schema for the VEO ScriptMaster output
const scriptDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    script: { type: Type.STRING, description: "A brief summary of the script segment." },
    characters: { 
      type: Type.ARRAY, 
      description: "List of key characters appearing in this segment.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name", "description"]
      }
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
  required: ["script", "scenes", "style", "characters"]
};

// Helper to clean potentially markdown-wrapped JSON
const cleanJsonOutput = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.slice(7);
  } else if (clean.startsWith('```')) {
    clean = clean.slice(3);
  }
  if (clean.endsWith('```')) {
    clean = clean.slice(0, -3);
  }
  return clean.trim();
};

// Chunking configuration
const MAX_CHUNK_WORDS = 1200; // Safe limit for ~8k output context (approx 48-50 scenes)

export const generatePromptsFromScript = async (formData: FormData): Promise<ScriptData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  if (!formData.script.trim()) {
    throw new Error("Content cannot be empty.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';

  // Split script into words to check length
  const words = formData.script.trim().split(/\s+/);
  
  if (words.length <= MAX_CHUNK_WORDS) {
    // Process as single request
    return generateChunk(ai, model, formData, formData.script, 1, null, null);
  } else {
    // Process in batches
    return generateBatchedChunks(ai, model, formData, words);
  }
};

// Logic to handle splitting and merging multiple chunks
const generateBatchedChunks = async (
    ai: GoogleGenAI, 
    model: string, 
    formData: FormData, 
    allWords: string[]
): Promise<ScriptData> => {
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    
    // Simple chunking by word count
    for (const word of allWords) {
        currentChunk.push(word);
        if (currentChunk.length >= MAX_CHUNK_WORDS) {
            // Try to break on a sentence ending if possible (naive approach)
            if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
                chunks.push(currentChunk.join(' '));
                currentChunk = [];
            }
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    let combinedScenes: Scene[] = [];
    let combinedCharacters: Character[] = [];
    let globalStyle = "";
    let fullScriptSummary = "";
    let nextSceneId = 1;

    // User Override Logic Distribution
    let remainingOverrideScenes = formData.numScenes ? parseInt(formData.numScenes) : null;
    const totalWords = allWords.length;

    for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        
        // Calculate portion of override scenes for this chunk if applicable
        let chunkOverrideCount = null;
        if (remainingOverrideScenes !== null) {
            const chunkWeight = chunkText.split(/\s+/).length / totalWords;
            // Last chunk gets the remainder to ensure sum is correct
            if (i === chunks.length - 1) {
                chunkOverrideCount = remainingOverrideScenes;
            } else {
                chunkOverrideCount = Math.round(remainingOverrideScenes * chunkWeight);
                remainingOverrideScenes -= chunkOverrideCount;
            }
        }

        // Context for continuation
        const contextData = i > 0 ? {
            style: globalStyle,
            characters: combinedCharacters
        } : null;

        try {
            // Generate
            const result = await generateChunk(
                ai, 
                model, 
                { ...formData, numScenes: chunkOverrideCount ? String(chunkOverrideCount) : '' }, 
                chunkText, 
                nextSceneId,
                contextData,
                i + 1 // Chunk index for logging
            );

            // Merge Data
            if (i === 0) {
                globalStyle = result.style;
                fullScriptSummary = result.script;
            } else {
                fullScriptSummary += "\n" + result.script;
            }

            // Dedupe characters
            const newChars = result.characters.filter(nc => 
                !combinedCharacters.some(ec => ec.name === nc.name)
            );
            combinedCharacters = [...combinedCharacters, ...newChars];

            // Add scenes (IDs should already be correct from generateChunk logic, but let's double check/fix uniqueness if needed)
            combinedScenes = [...combinedScenes, ...result.scenes];
            
            // Update next ID
            if (result.scenes.length > 0) {
                nextSceneId = result.scenes[result.scenes.length - 1].id + 1;
            }

        } catch (e) {
            console.error(`Error generating chunk ${i + 1}:`, e);
            // We continue to try next chunks even if one fails, or throw? 
            // Better to throw so user knows it failed.
            throw new Error(`Failed processing part ${i + 1} of the script. Try reducing length.`);
        }
    }

    return {
        script: fullScriptSummary,
        characters: combinedCharacters,
        style: globalStyle,
        scenes: combinedScenes
    };
};

// Core generation function
const generateChunk = async (
    ai: GoogleGenAI, 
    model: string, 
    formData: FormData, 
    scriptSegment: string,
    startSceneId: number,
    context: { style: string, characters: Character[] } | null,
    chunkIndex: number | null
): Promise<ScriptData> => {

  const { niche, visualStyle, styleKeywords, aspectRatio, numScenes, referenceImage } = formData;

  // --- SCENE CALCULATION LOGIC ---
  const wordCount = scriptSegment.trim().split(/\s+/).length;
  const estimatedDurationSeconds = (wordCount / 150) * 60;
  
  let targetScenes = 0;
  let sceneCountInstruction = "";

  if (numScenes && parseInt(numScenes) > 0) {
    targetScenes = parseInt(numScenes);
    sceneCountInstruction = `Target exactly ${targetScenes} scenes for THIS SEGMENT (User Override).`;
  } else {
    // STRICT RULE: 1 Scene per 10 seconds
    targetScenes = Math.ceil(estimatedDurationSeconds / 10);
    targetScenes = Math.max(1, targetScenes);

    sceneCountInstruction = `
      * This segment is approx. ${wordCount} words (~${Math.round(estimatedDurationSeconds)}s).
      * **MANDATORY REQUIREMENT**: You MUST generate exactly **${targetScenes} scenes** for this segment.
      * Logic: 10 seconds per scene rule.
      * **CRITICAL**: Distribute these ${targetScenes} scenes evenly to cover the ENTIRE text of this segment.
    `;
  }

  // Token Optimization
  const optimizationInstruction = `
      * **TOKEN OPTIMIZATION**: Keep 'title' and 'description' very short (under 10 words). 
      * Focus your output tokens on the 'visual_prompt'.
      * Start Scene IDs from: ${startSceneId}.
  `;

  let contextInstruction = "";
  if (context) {
      contextInstruction = `
      * **CONTINUATION MODE**: This is a later part of a larger script.
      * **MAINTAIN STYLE**: "${context.style}"
      * **EXISTING CHARACTERS**: ${context.characters.map(c => c.name).join(', ')}. Use these if they appear.
      * Do not redefine the style, just apply it.
      `;
  }

  const systemInstruction = `
You are an AI service called VEO ScriptMaster.

1. **Task**: Analyze the provided script segment and break it into linear chronological scenes.
2. **Rules**:
   ${sceneCountInstruction}
   ${optimizationInstruction}
   ${contextInstruction}

3. **Output**:
   * Create detailed, cinematic, VEO-ready prompts for *each* scene.
   * Global Style: "${visualStyle}".
   * Keywords: "${styleKeywords}".
   * **Prompt Structure**: [Subject Action] + [Environment/Context] + [Camera Angle: ${aspectRatio}] + [Lighting] + [Style Keywords].
   * Format for aspect ratio: ${aspectRatio}.
   * Each scene includes "generate_image": true.
   * Return ONLY valid JSON matching the schema.
  `;

  const userPrompt = `
INPUT SCRIPT SEGMENT ${chunkIndex ? `(Part ${chunkIndex})` : ''}:
---
${scriptSegment}
---
CONTEXT:
- Niche: ${niche || 'General'}
- Reference Image Provided: ${referenceImage ? "YES" : "NO"}

Generate the JSON plan.
`;

  const parts: any[] = [{ text: userPrompt }];

  if (formData.referenceImage && !context) {
    // Only send image on first chunk to save tokens/bandwidth, or if single chunk
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

    let text = response.text;
    if (!text) throw new Error("No response text generated.");
    
    text = cleanJsonOutput(text);
    const data = JSON.parse(text) as ScriptData;
    
    // Post-processing: Ensure IDs are sequential relative to startSceneId
    // The AI *should* follow instruction, but we enforce it here to be safe.
    if (data.scenes.length > 0) {
        data.scenes.forEach((scene, idx) => {
            scene.id = startSceneId + idx;
        });
    }

    return data;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate script plan: ${errorMessage}`);
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

  // Logic duplicate for suggestion to match the generation logic
  const wordCount = script.trim().split(/\s+/).length;
  const estimatedDurationSeconds = (wordCount / 150) * 60;
  const strictCount = Math.ceil(estimatedDurationSeconds / 10);
  
  return String(Math.max(1, strictCount));
};
