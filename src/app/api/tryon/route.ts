import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/util/apiRoute';
import { guards } from '@/lib/util/validation';
import { typedFetch } from '@/lib/util/http';
import { poll } from '@/lib/util/promise';
import { runWithFashnConcurrency } from '@/lib/util/concurrency';
import { withRetry } from '@/lib/util/errorHandling';
import { getFashnEnv } from '@/lib/util/env';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BASE_URL = 'https://api.fashn.ai/v1';

async function toBase64DataUrl(input: string): Promise<string> {
  if (input.startsWith('data:')) return input;

  let buffer: Buffer;
  let contentType = 'image/png';

  if (input.startsWith('/')) {
    const publicDir = path.join(process.cwd(), 'public');
    const relRaw = input.replace(/^\//, '');
    const relDecoded = (() => {
      try {
        return decodeURIComponent(relRaw);
      } catch {
        return relRaw;
      }
    })();
    const absPath = path.normalize(path.join(publicDir, relDecoded));
    if (!absPath.startsWith(publicDir + path.sep) && absPath !== publicDir) {
      throw new Error('Invalid image path');
    }
    buffer = await fs.readFile(absPath);
  } else if (/^https?:\/\//i.test(input)) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
    const arr = await res.arrayBuffer();
    buffer = Buffer.from(arr);
    const ct = res.headers.get('content-type');
    if (ct && /^image\//.test(ct)) contentType = ct;
  } else {
    const publicDir = path.join(process.cwd(), 'public');
    const relDecoded = (() => {
      try {
        return decodeURIComponent(input);
      } catch {
        return input;
      }
    })();
    const absPath = path.normalize(path.join(publicDir, relDecoded));
    if (!absPath.startsWith(publicDir + path.sep) && absPath !== publicDir) {
      throw new Error('Invalid image path');
    }
    buffer = await fs.readFile(absPath);
  }

  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  contentType = 'image/webp';

  return `data:${contentType};base64,${optimized.toString('base64')}`;
}

async function runSingleTryOn(characterImageUrl: string, clothingImageUrl: string, apiKey: string): Promise<string> {
  return runWithFashnConcurrency(async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    } as const;

    const [modelDataUrl, garmentDataUrl] = await Promise.all([
      toBase64DataUrl(characterImageUrl),
      toBase64DataUrl(clothingImageUrl),
    ]);

    // Do not retry /run to avoid duplicate paid predictions.
    const runData = await typedFetch<{ id: string }>(
      `${BASE_URL}/run`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model_name: 'tryon-max',
          inputs: {
            model_image: modelDataUrl,
            product_image: garmentDataUrl,
            resolution: '1k',
            generation_mode: 'balanced',
            num_images: 1,
          },
        }),
      },
      { apiName: 'FASHN' }
    );

    const result = await poll<{ status: string; output?: string[]; error?: string }>({
      fn: () =>
        withRetry(
          () => typedFetch(`${BASE_URL}/status/${runData.id}`, { headers }, { apiName: 'FASHN' }),
          'FASHN /status'
        ),
      // Stop polling on terminal states so we can surface actual API failure
      // instead of masking it as a timeout in the UI.
      isDone: (r) =>
        r.status === 'completed' ||
        r.status === 'failed' ||
        r.status === 'canceled',
      intervalMs: 3000,
      timeoutMs: 120_000,
    });

    if (result.status === 'completed' && result.output && result.output[0]) return result.output[0];
    if (result.status === 'completed') {
      throw new Error('FASHN AI completed without output image');
    }
    if (result.status === 'failed' || result.status === 'canceled') {
      throw new Error(`FASHN AI failed: ${result.error ?? 'unknown'}`);
    }
    throw new Error('FASHN AI: Prediction timed out after 120 seconds.');
  });
}

export const POST = createHandler<{ characterImageUrl: string; clothingImageUrl?: string; clothingImageUrls?: string[] }, { images: string[] }>({
  parse: async (req: NextRequest) => guards.tryon(await req.json()),
  rateLimit: 'tryOn',
  handle: async ({ characterImageUrl, clothingImageUrl, clothingImageUrls }) => {
    const { FASHN_AI_API_KEY } = getFashnEnv();
    const items = (Array.isArray(clothingImageUrls) && clothingImageUrls.length > 0)
      ? clothingImageUrls
      : (clothingImageUrl ? [clothingImageUrl] : []);
    const uniqueItems = Array.from(new Set(items));

    let currentBase = characterImageUrl;
    const outputs: string[] = [];
    const errors: string[] = [];
    for (const itemUrl of uniqueItems) {
      try {
        const image = await runSingleTryOn(currentBase, itemUrl, FASHN_AI_API_KEY);
        outputs.push(image);
        currentBase = image;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown try-on error';
        errors.push(msg);
      }
    }
    if (outputs.length === 0) {
      throw new Error(errors[0] || 'Failed to apply selected garments');
    }
    return { images: outputs };
  },
});

