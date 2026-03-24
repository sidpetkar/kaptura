import { GoogleGenAI, type Chat } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const MODEL_FLASH = 'gemini-3.1-flash-image-preview';
const MODEL_PRO = 'gemini-3-pro-image-preview';

const COMPLEX_KEYWORDS = [
  'professional', 'high quality', 'high-quality', 'text', 'logo',
  'infographic', 'detailed', 'precise', 'typography', 'render text',
  'diagram', 'chart', 'menu', 'poster', 'brochure', 'magazine',
];

const SUPPORTED_RATIOS = [
  { label: '1:1', value: 1 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
  { label: '4:5', value: 4 / 5 },
  { label: '5:4', value: 5 / 4 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
];

export interface AIEditResult {
  text?: string;
  imageBlob?: Blob;
  model: string;
}

function selectModel(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (prompt.length > 80) return MODEL_PRO;
  if (COMPLEX_KEYWORDS.some((kw) => lower.includes(kw))) return MODEL_PRO;
  return MODEL_FLASH;
}

function closestAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  let best = SUPPORTED_RATIOS[0];
  let bestDiff = Infinity;
  for (const entry of SUPPORTED_RATIOS) {
    const diff = Math.abs(entry.value - ratio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = entry;
    }
  }
  return best.label;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

function getMimeType(blob: Blob): string {
  if (blob.type && blob.type.startsWith('image/')) return blob.type;
  return 'image/jpeg';
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error(
      'Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env file.\n' +
      'Get a key from https://aistudio.google.com',
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: API_KEY });
  }
  return client;
}

export function isAIConfigured(): boolean {
  return !!API_KEY;
}

function parseApiError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('429') || lower.includes('quota') || lower.includes('exceeded')) {
    if (lower.includes('limit: 0') || lower.includes('limit:0')) {
      return new Error(
        'Image generation is not enabled for your API key. ' +
        'Go to Google AI Studio → Get API key and ensure your key has access to image generation models, ' +
        'or create a new key with billing enabled.',
      );
    }
    return new Error(
      'API quota exceeded. You\'ve hit the rate limit for this model. ' +
      'Wait a minute and try again, or check your plan at ai.google.dev.',
    );
  }

  if (lower.includes('403') || lower.includes('permission') || lower.includes('forbidden')) {
    return new Error(
      'API key doesn\'t have permission for image generation. ' +
      'Make sure your Gemini API key supports image generation models.',
    );
  }

  if (lower.includes('401') || lower.includes('invalid') && lower.includes('key')) {
    return new Error(
      'Invalid API key. Check that VITE_GEMINI_API_KEY is set correctly in your .env file.',
    );
  }

  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return new Error('Network error. Check your internet connection and try again.');
  }

  const short = raw.length > 200 ? raw.slice(0, 200) + '…' : raw;
  return new Error(short);
}

export class AIEditSession {
  private chat: Chat | null = null;
  private _model: string = MODEL_FLASH;
  private _turnCount = 0;

  get model(): string {
    return this._model;
  }

  get modelLabel(): string {
    return this._model === MODEL_PRO ? 'Nano Banana Pro' : 'Nano Banana 2';
  }

  get turnCount(): number {
    return this._turnCount;
  }

  /**
   * Start a new multi-turn editing session.
   * Model is auto-selected on first message if not provided.
   */
  start(model?: string): void {
    this._model = model ?? MODEL_FLASH;
    this.chat = null;
    this._turnCount = 0;
  }

  private ensureChat(model: string, aspectRatio?: string): Chat {
    if (this.chat && this._model === model) return this.chat;
    this._model = model;

    const ai = getClient();
    this.chat = ai.chats.create({
      model,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        ...(aspectRatio && {
          imageConfig: {
            aspectRatio,
            imageSize: model === MODEL_PRO ? '2K' : '1K',
          },
        }),
      },
    });
    return this.chat;
  }

  /**
   * Send an edit message. On the first turn, includes the source image.
   * Subsequent turns are text-only (the chat maintains image context).
   */
  async sendMessage(
    prompt: string,
    sourceImageBlob?: Blob,
    referenceImageBlobs?: Blob[],
    imageWidth?: number,
    imageHeight?: number,
  ): Promise<AIEditResult> {
    const isFirstTurn = this._turnCount === 0;
    const model = isFirstTurn ? selectModel(prompt) : this._model;
    const aspectRatio = imageWidth && imageHeight
      ? closestAspectRatio(imageWidth, imageHeight)
      : undefined;

    const chat = this.ensureChat(model, aspectRatio);

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    parts.push({ text: prompt });

    if (isFirstTurn && sourceImageBlob) {
      const base64 = await blobToBase64(sourceImageBlob);
      parts.push({
        inlineData: {
          mimeType: getMimeType(sourceImageBlob),
          data: base64,
        },
      });
    }

    if (referenceImageBlobs && referenceImageBlobs.length > 0) {
      for (const refBlob of referenceImageBlobs) {
        const base64 = await blobToBase64(refBlob);
        parts.push({
          inlineData: {
            mimeType: getMimeType(refBlob),
            data: base64,
          },
        });
      }
    }

    let response;
    try {
      response = await chat.sendMessage({ message: parts });
    } catch (err: unknown) {
      throw parseApiError(err);
    }
    this._turnCount++;

    let text: string | undefined;
    let imageBlob: Blob | undefined;

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.thought) continue;
        if (part.text) {
          text = (text ?? '') + part.text;
        } else if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageBlob = base64ToBlob(part.inlineData.data, mime);
        }
      }
    }

    return { text, imageBlob, model: this._model };
  }

  end(): void {
    this.chat = null;
    this._turnCount = 0;
  }
}
