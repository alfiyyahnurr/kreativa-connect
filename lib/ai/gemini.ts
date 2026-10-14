import { createGoogleGenerativeAI } from '@ai-sdk/google';

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  '';

export const googleProvider = createGoogleGenerativeAI({
  apiKey,
});

// Default to stable gemini-3.5-flash-lite to prevent 503 high demand spikes on free tier
const rawModel = process.env.AI_MODEL_DEFAULT || '';
export const activeModelName =
  rawModel &&
  rawModel !== 'gemini-1.5-flash' &&
  rawModel !== 'gemini-2.0-flash' &&
  rawModel !== 'gemini-2.5-flash'
    ? rawModel
    : 'gemini-3.5-flash-lite';

export const defaultGeminiModel = googleProvider(activeModelName);
export const fallbackGeminiModel = googleProvider('gemini-3.1-flash-lite');

