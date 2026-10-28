import { useState, useEffect } from 'react';

// Image-editing models available through OpenRouter (output modality "image").
// Ordered roughly best-to-cheapest within each vendor group.
export const AI_IMAGE_MODELS = [
  { group: 'Google', id: 'google/gemini-nano-banana-2.1', label: 'Nano Banana 2.1' },
  { group: 'Google', id: 'google/gemini-3.1-flash-image', label: 'Nano Banana 2' },
  { group: 'Google', id: 'google/gemini-3.1-flash-lite-image', label: 'Nano Banana 2 Lite' },
  { group: 'Google', id: 'google/gemini-3-pro-image', label: 'Nano Banana Pro' },
  { group: 'Google', id: 'google/gemini-2.5-flash-image', label: 'Nano Banana (1st gen)' },
  { group: 'OpenAI', id: 'openai/gpt-5.4-image-2', label: 'GPT-5.4 Image 2' },
  { group: 'OpenAI', id: 'openai/gpt-5-image', label: 'GPT-5 Image' },
  { group: 'OpenAI', id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini' },
];

export const DEFAULT_AI_MODEL = 'google/gemini-2.5-flash-image';

// Maps previously stored model ids (direct-Gemini ids and retired -preview slugs)
// to their current OpenRouter equivalents.
const LEGACY_MODEL_IDS = {
  'gemini-2.5-flash-image': 'google/gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image',
  'gemini-3.1-flash-image': 'google/gemini-3.1-flash-image',
  'gemini-3-pro-image-preview': 'google/gemini-3-pro-image',
  'gemini-3-pro-image': 'google/gemini-3-pro-image',
  'google/gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image',
  'google/gemini-3-pro-image-preview': 'google/gemini-3-pro-image',
};

export const migrateModelId = (id) => {
  if (AI_IMAGE_MODELS.some(m => m.id === id)) return id;
  return LEGACY_MODEL_IDS[id] || DEFAULT_AI_MODEL;
};

// Snapshot of OpenRouter pricing (USD/token) used until live prices load.
const FALLBACK_PRICING = {
  'google/gemini-nano-banana-2.1': { prompt: 0.0000015, completion: 0.0000075, image_output: 0.00003 },
  'google/gemini-3.1-flash-image': { prompt: 0.0000005, completion: 0.000003, image_output: 0.00006 },
  'google/gemini-3.1-flash-lite-image': { prompt: 0.00000025, completion: 0.0000015, image_output: 0.00003 },
  'google/gemini-3-pro-image': { prompt: 0.000002, completion: 0.000012, image: 0.000002, image_output: 0.00012 },
  'google/gemini-2.5-flash-image': { prompt: 0.0000003, completion: 0.0000025, image: 0.0000003, image_output: 0.00003 },
  'openai/gpt-5.4-image-2': { prompt: 0.000008, completion: 0.000015, image_output: 0.00003 },
  'openai/gpt-5-image': { prompt: 0.00001, completion: 0.00001, image_output: 0.00004 },
  'openai/gpt-5-image-mini': { prompt: 0.0000025, completion: 0.000002, image_output: 0.000008 },
};

// Rough token counts for a typical image edit: ~60 prompt text tokens,
// ~1290 tokens for a ~1MP input image, ~1290 for a ~1MP output image, ~30 text out.
const EST = { promptText: 60, inputImage: 1290, outputImage: 1290, outputText: 30 };

// Estimated average cost in USD of one edit at the given per-token pricing.
export const estimateCostPerGen = (pricing) => {
  if (!pricing) return null;
  const num = (v) => { const n = parseFloat(v); return isNaN(n) || n < 0 ? 0 : n; };
  const prompt = num(pricing.prompt);
  const completion = num(pricing.completion);
  const imageIn = pricing.image != null ? num(pricing.image) : prompt;
  const imageOut = pricing.image_output != null ? num(pricing.image_output) : completion;
  return prompt * EST.promptText + imageIn * EST.inputImage
    + imageOut * EST.outputImage + completion * EST.outputText;
};

export const formatCost = (cost) => {
  if (cost == null) return '';
  return `$${cost < 0.1 ? cost.toFixed(3) : cost.toFixed(2)}`;
};

const fallbackCosts = () => {
  const map = {};
  for (const m of AI_IMAGE_MODELS) map[m.id] = estimateCostPerGen(FALLBACK_PRICING[m.id]);
  return map;
};

let liveCosts = null; // { [modelId]: number } once fetched
let fetchPromise = null;
const listeners = new Set();

// Returns { costs, live }: costs maps model id -> estimated $/generation.
// Starts from a static snapshot, then updates live from openrouter.ai/api/v1/models.
export const useImageModelCosts = () => {
  const [state, setState] = useState(() => ({ costs: liveCosts || fallbackCosts(), live: !!liveCosts }));

  useEffect(() => {
    if (liveCosts) {
      setState({ costs: liveCosts, live: true });
      return;
    }
    if (!fetchPromise) {
      fetchPromise = fetch('https://openrouter.ai/api/v1/models')
        .then(res => res.json())
        .then(data => {
          const prices = {};
          for (const m of data.data || []) prices[m.id] = m.pricing;
          const costs = {};
          for (const m of AI_IMAGE_MODELS) {
            costs[m.id] = estimateCostPerGen(prices[m.id]) ?? estimateCostPerGen(FALLBACK_PRICING[m.id]);
          }
          liveCosts = costs;
          listeners.forEach(fn => fn(costs));
        })
        .catch(err => console.warn('Could not load live OpenRouter pricing:', err));
    }
    const fn = (costs) => setState({ costs, live: true });
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  return state;
};

// Grouped option data for model <select> dropdowns:
// [{ group, options: [{ id, label }] }]
export const MODEL_OPTION_GROUPS = [...new Set(AI_IMAGE_MODELS.map(m => m.group))]
  .map(group => ({ group, options: AI_IMAGE_MODELS.filter(m => m.group === group) }));
