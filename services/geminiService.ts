import { GoogleGenAI, Type } from "@google/genai";
import type { MusicRecommendation } from '../types';

let ai: GoogleGenAI | null = null;

export const initializeAi = (apiKey: string) => {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null;
    throw new Error("Invalid API Key format or other initialization error.");
  }
};


const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      trackName: {
        type: Type.STRING,
        description: "A creative and fitting name for the music track.",
      },
      mood: {
        type: Type.STRING,
        description: "A short, one-or-two-word description of the track's primary mood (e.g., 'Uplifting', 'Melancholy', 'Suspenseful').",
      },
      musicDescription: {
        type: Type.STRING,
        description: "A detailed description for a sophisticated AI music generator. Be specific and creative. Include: tempo (e.g., 'very slow 60 bpm'), key/mood ('eerie minor key', 'atonal', 'dissonant'), and specific instrumentation (e.g., 'features a detuned music box melody, sparse piano chords, low rumbling bass synth, and no drums', or 'haunting female choir pads with heavy reverb'). Use words that guide the sound design.",
      },
    },
    required: ["trackName", "mood", "musicDescription"],
  },
};

export const generateMusicRecommendations = async (topic: string, story: string, mood: string): Promise<Omit<MusicRecommendation, 'id' | 'previewUrl'>[]> => {
  if (!ai) {
    throw new Error("AI Client not initialized. Please set your API key.");
  }

  const prompt = `
    As an expert AI music prompt engineer, your task is to generate diverse and detailed prompts for creating background music for short-form videos.
    Based on the following video details, generate a list of 20 unique and creative music track ideas.

    Video Topic: ${topic}
    Video Story/Content: ${story}
    Desired Mood: ${mood}

    For each track, provide a creative name, a one-word mood label, and a highly detailed description for an AI music generator.
    The description MUST be specific about the feeling and sound.
    - For tempo, use descriptions like 'slow and dragging 70 bpm' or 'frantic 160 bpm'.
    - For harmony, use 'dissonant chords', 'atonal pads', 'sad minor key', 'hopeful major key'.
    - For instrumentation, be varied. Suggest things like 'detuned piano', 'glockenspiel', 'music box', 'heavy synth bass', 'distorted electric guitar', 'string section', 'haunting choir'.
    - For rhythm, specify 'no drums', 'a simple heartbeat kick drum', 'complex electronic beat', or 'tribal percussion'.
    - For effects, mention 'heavy reverb', 'subtle delay', or 'wavering pitch'.

    Example for a 'creepy' mood: 'A very slow, dragging 60 bpm tempo in a dissonant, atonal scale. Features a simple, repetitive melody from a detuned music box with heavy reverb and delay. Accompanied by low, rumbling bass synth drones and occasional, sparse, discordant piano chords. No drums are present, creating a tense, empty atmosphere.'

    Return the list in the specified JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9, // Increased for more creative variety
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as { trackName: string; mood: string; musicDescription: string }[];

  } catch (error) {
    console.error("Error generating music recommendations:", error);
    throw error;
  }
};