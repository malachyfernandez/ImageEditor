import { useState, useEffect } from 'react';

// Image-editing models available through OpenRouter's Images API
// (POST /api/v1/images — all accept `input_references` for image-to-image edits).
// "Open Weights" = models with publicly available weights.
// aspectRatios = values the model's `aspect_ratio` parameter accepts ('auto' =
// provider picks, usually meaning it preserves the input image's aspect).
export const AI_IMAGE_MODELS = [
  { group: 'Open Weights', id: 'black-forest-labs/flux-3-image', label: 'FLUX 3 Image',
    aspectRatios: ['21:9', '2:1', '16:9', '3:2', '7:5', '4:3', '5:4', '1:1', '4:5', '3:4', '5:7', '2:3', '9:16', '1:2', '9:21', 'auto'] },
  { group: 'Open Weights', id: 'qwen/qwen-image-3-pro', label: 'Qwen Image 3 Pro',
    aspectRatios: ['1:1', '1:2', '1:4', '2:1', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '9:16', '16:9'] },
  { group: 'Open Weights', id: 'qwen/qwen-image-3', label: 'Qwen Image 3',
    aspectRatios: ['1:1', '1:2', '1:4', '2:1', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '9:16', '16:9'] },
  { group: 'Open Weights', id: 'black-forest-labs/flux-3-image-klein', label: 'FLUX 3 Klein',
    aspectRatios: ['21:9', '2:1', '16:9', '3:2', '7:5', '4:3', '5:4', '1:1', '4:5', '3:4', '5:7', '2:3', '9:16', '1:2', '9:21', 'auto'] },
  { group: 'Open Weights', id: 'qwen/qwen-image-2.1-turbo', label: 'Qwen Image 2.1 Turbo',
    aspectRatios: ['1:1', '1:2', '1:4', '2:1', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '9:16', '16:9'] },
  { group: 'Open Weights', id: 'black-forest-labs/flux.2-klein-4b', label: 'FLUX.2 Klein 4B',
    aspectRatios: ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', 'auto'] },
  { group: 'Open Weights', id: 'tencent/hy-image-v3.5-preview', label: 'Hunyuan Image 3.5 (preview)',
    aspectRatios: ['1:1', '1:2', '1:4', '2:1', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '9:16', '16:9'] },
  { group: 'Google', id: 'google/gemini-nano-banana-2.1', label: 'Nano Banana 2.1',
    aspectRatios: ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'] },
  { group: 'Google', id: 'google/gemini-3.1-flash-image', label: 'Nano Banana 2',
    aspectRatios: ['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'] },
  { group: 'Google', id: 'google/gemini-3-pro-image', label: 'Nano Banana Pro',
    aspectRatios: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'] },
  { group: 'OpenAI', id: 'openai/gpt-5.4-image-2', label: 'GPT-5.4 Image 2',
    aspectRatios: ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16', '21:9', 'auto'] },
  { group: 'OpenAI', id: 'openai/gpt-5-image-mini', label: 'GPT-5 Image Mini',
    aspectRatios: ['1:1', '3:2', '2:3', 'auto'] },
  { group: 'Other', id: 'bytedance-seed/seedream-5-0-pro', label: 'Seedream 5.0 Pro',
    aspectRatios: ['1:1', '1:2', '2:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '9:19.5', '19.5:9', '9:20', '20:9', '9:21', '21:9', 'auto'] },
  { group: 'Other', id: 'bytedance-seed/seedream-5-0-flash', label: 'Seedream 5.0 Flash',
    aspectRatios: ['1:1', '1:2', '2:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '9:19.5', '19.5:9', '9:20', '20:9', '9:21', '21:9', 'auto'] },
  { group: 'Other', id: 'x-ai/grok-imagine-image-2.0', label: 'Grok Imagine 2.0',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9', '2:3', '3:2', '9:19.5', '19.5:9', '9:20', '20:9', '1:2', '2:1', 'auto'] },
  { group: 'Other', id: 'krea/k3-edit', label: 'Krea K3 Edit',
    aspectRatios: ['1:1', '4:3', '3:2', '16:9', '4:5', '2:3', '9:16'] },
  { group: 'Other', id: 'sourceful/riverflow-v2.5-fast', label: 'Riverflow 2.5 Fast',
    aspectRatios: ['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', 'auto'] },
  { group: 'Other', id: 'microsoft/mai-image-2.6-flash', label: 'MAI Image 2.6 Flash',
    aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', 'auto'] },
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

// --- Aspect ratio helpers ---

export const parseAspect = (ratio) => {
  const [w, h] = String(ratio).split(':').map(Number);
  return h ? w / h : NaN;
};

// How close two aspect ratios are, in log space (symmetric; 0 = identical).
const aspectError = (a, b) => Math.abs(Math.log(a / b));

const ASPECT_MATCH_TOLERANCE = 0.02; // ~2% counts as "same aspect"

// Finds the closest aspect ratio a model supports to the target aspect.
// Returns { ratio, value, matches } or null when the model has no ratio data.
export const nearestAspect = (aspectRatios, targetAspect) => {
  const ratios = (aspectRatios || []).filter(r => r !== 'auto');
  if (!ratios.length || !isFinite(targetAspect) || targetAspect <= 0) return null;
  let best = null, bestErr = Infinity;
  for (const r of ratios) {
    const err = aspectError(parseAspect(r), targetAspect);
    if (err < bestErr) { bestErr = err; best = r; }
  }
  return { ratio: best, value: parseAspect(best), matches: bestErr < ASPECT_MATCH_TOLERANCE };
};

// The largest rect of `targetAspect` that fits inside srcW x srcH,
// positioned by offset {x,y} in [0,1] (0.5 = centered). Pure math, testable.
export const computeCropRect = (srcW, srcH, targetAspect, offset = { x: 0.5, y: 0.5 }) => {
  let w = srcW, h = srcW / targetAspect;
  if (h > srcH) { h = srcH; w = srcH * targetAspect; }
  const clamp01 = v => Math.min(1, Math.max(0, v ?? 0.5));
  return {
    x: (srcW - w) * clamp01(offset.x),
    y: (srcH - h) * clamp01(offset.y),
    w, h,
  };
};

// --- Pricing ---

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
const staticAspects = () => {
  const map = {};
  for (const m of AI_IMAGE_MODELS) map[m.id] = m.aspectRatios;
  return map;
};

let liveInfo = null; // { costs, aspects } once fetched
let fetchPromise = null;
const listeners = new Set();

// Returns { costs, aspects, live }:
//   costs   = { [modelId]: estimated $/generation }
//   aspects = { [modelId]: [aspect ratios the model accepts] }
// Both start from static snapshots, then update live from OpenRouter's
// Images API (model list + per-endpoint pricing records).
export const useImageModelCosts = () => {
  const [state, setState] = useState(() => ({
    costs: liveInfo?.costs || fallbackCosts(),
    aspects: liveInfo?.aspects || staticAspects(),
    live: !!liveInfo,
  }));

  useEffect(() => {
    if (liveInfo) {
      setState({ ...liveInfo, live: true });
      return;
    }
    if (!fetchPromise) {
      fetchPromise = Promise.all([
        fetch('https://openrouter.ai/api/v1/images/models')
          .then(res => res.json())
          .then(d => {
            const aspects = {};
            for (const m of d.data || []) {
              const values = m.supported_parameters?.aspect_ratio?.values;
              if (values) aspects[m.id] = values;
            }
            return aspects;
          })
          .catch(() => ({})),
        Promise.all(AI_IMAGE_MODELS.map(m =>
          fetch(`https://openrouter.ai/api/v1/images/models/${m.id}/endpoints`)
            .then(res => res.json())
            .then(d => [m.id, estimateFromPricingLines(d.endpoints?.[0]?.pricing)])
            .catch(() => [m.id, null])
        )),
      ]).then(([liveAspects, priceEntries]) => {
        const costs = { ...FALLBACK_COSTS };
        for (const [id, cost] of priceEntries) {
          if (cost != null) costs[id] = cost;
        }
        liveInfo = { costs, aspects: { ...staticAspects(), ...liveAspects } };
        listeners.forEach(fn => fn(liveInfo));
      }).catch(err => console.warn('Could not load live OpenRouter model info:', err));
    }
    const fn = (info) => setState({ ...info, live: true });
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  return state;
};

// Grouped option data for model <select> dropdowns:
// [{ group, options: [{ id, label }] }]
export const MODEL_OPTION_GROUPS = [...new Set(AI_IMAGE_MODELS.map(m => m.group))]
  .map(group => ({ group, options: AI_IMAGE_MODELS.filter(m => m.group === group) }));
