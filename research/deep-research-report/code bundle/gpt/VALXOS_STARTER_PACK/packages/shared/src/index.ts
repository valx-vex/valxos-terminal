export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'ollama';
export type PermissionDecision = 'deny' | 'ask' | 'allow';
export type ToolName = 'Read' | 'Write' | 'Edit' | 'Bash' | 'Skill' | 'MCP';

export interface PermissionRule {
  pattern: string;
  decision: PermissionDecision;
  source?: string;
}

export interface MergedPermissions {
  allow: string[];
  deny: string[];
  ask: string[];
}

export interface McpServerConfig {
  type: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  cwd?: string;
}

export interface ValxosConfig {
  managed?: Partial<ValxosSettings>;
  user?: Partial<ValxosSettings>;
  project?: Partial<ValxosSettings>;
  local?: Partial<ValxosSettings>;
  cli?: Partial<ValxosSettings>;
}

export interface HookDefinition {
  event: HookEventName;
  matcher?: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export type HookEventName =
  | 'SessionStart'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PermissionRequest'
  | 'Stop';

export interface HookContext {
  event: HookEventName;
  toolName?: ToolName | string;
  toolInput?: unknown;
  toolResult?: unknown;
  rawUserPrompt?: string;
  env?: Record<string, string>;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  'argument-hint'?: string;
  'disable-model-invocation'?: boolean;
  'user-invocable'?: boolean;
  'allowed-tools'?: string[] | string;
  context?: 'fork' | 'inline';
}

export interface SkillDefinition {
  path: string;
  frontmatter: SkillFrontmatter;
  body: string;
}

export interface PluginManifest {
  name: string;
  version: string;
  commands?: string[];
  agents?: string[];
  skills?: string[];
  hooks?: string;
  mcp?: string;
}

export interface ValxosSettings {
  env: Record<string, string>;
  permissions: MergedPermissions;
  hooks: HookDefinition[];
  mcpServers: Record<string, McpServerConfig>;
  rules: string[];
}

export interface ToolCall {
  toolName: ToolName | string;
  input: unknown;
}

export interface RouteRequest {
  prompt: string;
  providerHint?: ProviderId;
  requireLocal?: boolean;
  costSensitivity?: 'low' | 'medium' | 'high';
  contextSize?: 'small' | 'medium' | 'large' | 'huge';
  needsSearch?: boolean;
  needsCoding?: boolean;
}

export interface RouteDecision {
  primary: ProviderId;
  fallback: ProviderId[];
  reason: string[];
  escapeHatches: string[];
}

export interface UniversalMessage {
  system: string[];
  messages: Array<{ role: 'user' | 'assistant' | 'tool'; content: string }>;
  tools: Array<{ name: string; description: string; inputSchema?: unknown }>;
  metadata: {
    sessionId: string;
    cwd: string;
    provider: ProviderId;
  };
}
