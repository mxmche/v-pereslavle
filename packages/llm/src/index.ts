import type { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Non-generic alias: zodToJsonSchema's generic signature hits TS2589 with ZodType<T>
const toJsonSchema = zodToJsonSchema as unknown as (schema: ZodType) => object;

export interface LlmProvider {
  extract<T>(system: string, prompt: string, schema: ZodType<T>, fnName?: string): Promise<T>;
  embed(texts: string[]): Promise<number[][]>;
}

export interface GigaChatOptions {
  credentials: string;
  scope?: string;
  model?: string;
  embeddingsModel?: string;
}

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const API_URL = 'https://gigachat.devices.sberbank.ru/api/v1';

export class GigaChatProvider implements LlmProvider {
  private token: { value: string; expiresAt: number } | null = null;
  // freemium allows a single concurrent stream
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly opts: GigaChatOptions) {}

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt - 60_000) return this.token.value;
    const res = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${this.opts.credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        RqUID: crypto.randomUUID(),
      },
      body: `scope=${this.opts.scope ?? 'GIGACHAT_API_PERS'}`,
    });
    if (!res.ok) throw new Error(`GigaChat OAuth failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_at: number };
    this.token = { value: data.access_token, expiresAt: data.expires_at };
    return this.token.value;
  }

  extract<T>(system: string, prompt: string, schema: ZodType<T>, fnName = 'save_result'): Promise<T> {
    return this.serial(async () => {
      const res = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await this.getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.opts.model ?? 'GigaChat-2',
          temperature: 0.1,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          functions: [{ name: fnName, parameters: toJsonSchema(schema) }],
          function_call: { name: fnName },
        }),
      });
      if (!res.ok) throw new Error(`GigaChat completion failed: ${res.status}`);
      const data = (await res.json()) as any;
      const args = data.choices[0].message.function_call.arguments;
      return schema.parse(typeof args === 'string' ? JSON.parse(args) : args);
    });
  }

  embed(texts: string[]): Promise<number[][]> {
    return this.serial(async () => {
      const res = await fetch(`${API_URL}/embeddings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await this.getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.opts.embeddingsModel ?? 'Embeddings', input: texts }),
      });
      if (!res.ok) throw new Error(`GigaChat embeddings failed: ${res.status}`);
      const data = (await res.json()) as { data: { embedding: number[] }[] };
      return data.data.map((d) => d.embedding);
    });
  }
}
