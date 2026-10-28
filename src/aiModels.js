import { useState, useEffect } from 'react';

// Image-editing models available through OpenRouter's Images API
// (POST /api/v1/images — all accept `input_references` for image-to-image edits).
// "Open Weights" = models with publicly available weights.
export const AI_IMAGE_MODELS = [
  { group: 'Open Weights', id: 'black-forest-labs/flux-3-image', label: 'FLUX 3 Image' },
  { group: 'Open Weights', id: 'qwen/qwen-image-3-pro', label: 'Qwen Image 3 Pro' },
  { group: 'Open Weights', id: 'qwen/qwen-image-3', label: 'Qwen Image 3' },
  { group: 'Open Weights', id: 'black-forest-labs/flux-3-image-klein', label: 'FLUX 3 Klein' },
  { group: 'Open Weights', id: 'qwen/qwen-image-2.1-turbo', label: 'Qwen Image 2.1 Turbo' },
  { group: 'Open Weights', id: 'black-forest-labs/flux.2-klein-4b', label: 'FLUX.2 Klein 4B' },
  { group: 'Open Weights', id: 'tencent/hy-image-v3.5-preview', label: 'Hunyuan Image 3.5 (preview)' },
  { group: 'Google', id: 'google/gemini-nano-banana-2.1', label: 'Nano Banana 2.1' },
  { group: 'Google', id: 'google/gemini-3.1-flash-image', label: 'Nano Banana 2' },
  { group: 'Google', id: 'google/gemini-3-pro-image', label: 'Nano Banana Pro' },
  { group: 'OpenAI', id: 'openai/gpt-5.4-image-2', label: 'GPT-5.4 Image 2' },
  { group: 'OpenAI', id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini' },
  { group: 'Other', id: 'bytedance-seed/seedream-5-0-pro', label: 'Seedream 5.0 Pro' },
  { group: 'Other', id: 'bytedance-seed/seedream-5-0-flash', label: 'Seedream 5.0 Flash' },
  { group: 'Other', id: 'x-ai/grok-imagine-image-2.0', label: 'Grok Imagine 2.0' },
  { group: 'Other', id: 'krea/k3-edit', label: 'Krea K3 Edit' },
  { group: 'Other', id: 'sourceful/riverflow-v2.5-fast', label: 'Riverflow 2.5 Fast' },
  { group: 'Other', id: 'microsoft/mai-image-2.6-flash', label: 'MAI Image 2.6 Flash' },
];

export const DEFAULT_AI_MODEL = 'google/gemini-nano-banana-2.1';

// Maps previously stored model ids (direct-Gemini ids, retired -preview
// slugs, and pruned models) to their current OpenRouter equivalents.
const LEGACY_MODEL_IDS = {
  'gemini-2.5-flash-image': 'google/gemini-nano-banana-2.1',
  'google/gemini-2.5-flash-image': 'google/gemini-nano-banana-2.1',
  'google/gemini-3.1-flash-lite-image': 'google/gemini-nano-banana-2.1',
  'gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image',
  'gemini-3.1-flash-image': 'google/gemini-3.1-flash-image',
  'google/gemini-3.1-flash-image-preview': 'google/gemini-3.1-flash-image',
  'gemini-3-pro-image-preview': 'google/gemini-3-pro-image',
  'gemini-3-pro-image': 'google/gemini-3-pro-image',
  'google/gemini-3-pro-image-preview': 'google/gemini-3-pro-image',
  'openai/gpt-5-image': 'openai/gpt-5.4-image-2',
};

export const migrateModelId = (id) => {
  if (AI_IMAGE_MODELS.some(m => m.id === id)) return id;
  return LEGACY_MODEL_IDS[id] || DEFAULT_AI_MODEL;
};

// Estimated USD per generation, used until live prices load.
const FALLBACK_COSTS = {
  'black-forest-labs/flux-3-image': 0.05,
  'qwen/qwen-image-3-pro': 0.045,
  'qwen/qwen-image-3': 0.035,
  'black-forest-labs/flux-3-image-klein': 0.01,
  'qwen/qwen-image-2.1-turbo': 0.02,
  'black-forest-labs/flux.2-klein-4b': 0.02,
  'tencent/hy-image-v3.5-preview': 0.01,
  'google/gemini-nano-banana-2.1': 0.04,
  'google/gemini-3.1-flash-image': 0.08,
  'google/gemini-3-pro-image': 0.16,
  'openai/gpt-5.4-image-2': 0.05,
  'openai/gpt-5-image-mini': 0.015,
  'bytedance-seed/seedream-5-0-pro': 0.05,
  'bytedance-seed/seedream-5-0-flash': 0.02,
  'x-ai/grok-imagine-image-2.0': 0.06,
  'krea/k3-edit': 0.05,
  'sourceful/riverflow-v2.5-fast': 0.02,
  'microsoft/mai-image-2.6-flash': 0.03,
};

// Rough quantities for a typical image edit: ~60 prompt text tokens,
// ~1290 tokens/MP for ~1MP input and output images, ~30 text tokens out.
const TOKEN_EST = { input_text: 60, input_image: 1290, output_image: 1290, output_text: 30, input_audio: 0 };

// Estimated average cost of one edit from an image endpoint's pricing lines
// ([{ billable, unit: 'image'|'megapixel'|'token', cost_usd, variant? }]).
// Tiered variants (e.g. 1K/2K/4K) are collapsed to the cheapest tier.
const estimateFromPricingLines = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  const cheapest = {};
  for (const p of lines) {
    if (p.cost_usd == null) continue;
    const key = `${p.billable}:${p.unit}`;
    cheapest[key] = Math.min(cheapest[key] ?? Infinity, p.cost_usd);
  }
  let total = 0, seen = false;
  for (const [key, cost] of Object.entries(cheapest)) {
    const [billable, unit] = key.split(':');
    if (unit === 'token') total += cost * (TOKEN_EST[billable] ?? 60);
    else if (unit === 'megapixel') total += cost * 1.2;
    else total += cost;
    seen = true;
  }
  return seen ? total : null;
};

export const formatCost = (cost) => {
  if (cost == null) return '';
  return `$${cost < 0.1 ? cost.toFixed(3) : cost.toFixed(2)}`;
};

const fallbackCosts = () => ({ ...FALLBACK_COSTS });

let liveCosts = null; // { [modelId]: number } once fetched
let fetchPromise = null;
const listeners = new Set();

// Returns { costs, live }: costs maps model id -> estimated $/generation.
// Starts from a static snapshot, then updates live by fetching each model's
// per-endpoint pricing from openrouter.ai/api/v1/images/models/{id}/endpoints.
export const useImageModelCosts = () => {
  const [state, setState] = useState(() => ({ costs: liveCosts || fallbackCosts(), live: !!liveCosts }));

  useEffect(() => {
    if (liveCosts) {
      setState({ costs: liveCosts, live: true });
      return;
    }
    if (!fetchPromise) {
      fetchPromise = Promise.all(AI_IMAGE_MODELS.map(m =>
        fetch(`https://openrouter.ai/api/v1/images/models/${m.id}/endpoints`)
          .then(res => res.json())
          .then(d => [m.id, estimateFromPricingLines(d.endpoints?.[0]?.pricing)])
          .catch(() => [m.id, null])
      )).then(entries => {
        const costs = { ...FALLBACK_COSTS };
        for (const [id, cost] of entries) {
          if (cost != null) costs[id] = cost;
        }
        liveCosts = costs;
        listeners.forEach(fn => fn(costs));
      }).catch(err => console.warn('Could not load live OpenRouter pricing:', err));
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
