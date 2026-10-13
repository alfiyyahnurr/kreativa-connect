import { google } from '@ai-sdk/google';

// Fallback to gemini-3.8-flash if unset or if legacy gemini-1.5-flash is passed
const rawModel = process.env.AI_MODEL_DEFAULT || '';
const modelName = rawModel && rawModel !== 'gemini-1.5-flash' ? rawModel : 'gemini-3.8-flash';

// Direct Google Gemini API (Free Tier: 15 RPM, 1,500 RPD)
export const defaultGeminiModel = google(modelName);
