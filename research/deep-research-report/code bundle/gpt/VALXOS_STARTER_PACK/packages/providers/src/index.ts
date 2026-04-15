import type { ProviderId, UniversalMessage } from '@valxos/shared';

export interface ProviderAdapter {
  id: ProviderId;
  send(message: UniversalMessage): Promise<{ text: string; raw?: unknown }>;
}

export class StubProviderAdapter implements ProviderAdapter {
  constructor(public readonly id: ProviderId) {}

  async send(message: UniversalMessage): Promise<{ text: string; raw?: unknown }> {
    return {
      text: `[${this.id}] starter adapter placeholder. Session ${message.metadata.sessionId} would route here.`,
      raw: message
    };
  }
}

export function createDefaultAdapters(): Record<ProviderId, ProviderAdapter> {
  return {
    anthropic: new StubProviderAdapter('anthropic'),
    openai: new StubProviderAdapter('openai'),
    gemini: new StubProviderAdapter('gemini'),
    ollama: new StubProviderAdapter('ollama')
  };
}
