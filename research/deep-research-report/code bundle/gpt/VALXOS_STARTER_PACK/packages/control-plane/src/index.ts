import type { ProviderId, RouteDecision, RouteRequest, UniversalMessage } from '@valxos/shared';

const COST_ORDER: ProviderId[] = ['ollama', 'gemini', 'openai', 'anthropic'];

export function decideRoute(request: RouteRequest): RouteDecision {
  const reason: string[] = [];
  const escapeHatches: string[] = [];
  let primary: ProviderId = request.providerHint ?? 'openai';

  if (request.requireLocal) {
    primary = 'ollama';
    reason.push('requireLocal=true -> ollama');
    escapeHatches.push('privacy-mode');
  } else if (request.contextSize === 'huge') {
    primary = 'gemini';
    reason.push('huge context -> gemini');
    escapeHatches.push('massive-context');
  } else if (request.needsCoding && request.costSensitivity === 'low') {
    primary = 'anthropic';
    reason.push('high-value coding task -> anthropic');
    escapeHatches.push('extended-thinking');
  } else if (request.needsCoding) {
    primary = request.providerHint ?? 'openai';
    reason.push('coding task -> openai default unless overridden');
    escapeHatches.push('computer-use');
  } else if (request.costSensitivity === 'high') {
    primary = 'ollama';
    reason.push('high cost sensitivity -> ollama');
  }

  const fallback = COST_ORDER.filter((provider) => provider !== primary);
  return { primary, fallback, reason, escapeHatches };
}

export function buildUniversalMessage(input: {
  sessionId: string;
  cwd: string;
  provider: ProviderId;
  system: string[];
  prompt: string;
  tools?: UniversalMessage['tools'];
}): UniversalMessage {
  return {
    system: input.system,
    messages: [{ role: 'user', content: input.prompt }],
    tools: input.tools ?? [],
    metadata: {
      sessionId: input.sessionId,
      cwd: input.cwd,
      provider: input.provider
    }
  };
}

export interface HandoverFile {
  sessionId: string;
  from: ProviderId;
  to: ProviderId;
  summary: string;
  openThreads: string[];
  toolState: Record<string, unknown>;
}

export function createHandoverFile(input: HandoverFile): string {
  return JSON.stringify(input, null, 2);
}
