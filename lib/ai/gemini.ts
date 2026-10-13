import { google } from '@ai-sdk/google';

// Default to stable gemini-3.5-flash-lite to prevent 503 high demand spikes on free tier
const rawModel = process.env.AI_MODEL_DEFAULT || '';
export const activeModelName =
  rawModel && rawModel !== 'gemini-1.5-flash' && rawModel !== 'gemini-3.8-flash' && rawModel !== 'gemini-2.5-flash'
    ? rawModel
    : 'gemini-3.5-flash-lite';

export const defaultGeminiModel = google(activeModelName);
export const fallbackGeminiModel = google('gemini-3.1-flash-lite');

