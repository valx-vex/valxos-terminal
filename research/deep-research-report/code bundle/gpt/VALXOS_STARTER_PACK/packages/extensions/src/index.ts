import { spawn } from 'node:child_process';
import type {
  HookContext,
  HookDefinition,
  PermissionDecision,
  SkillDefinition,
  ToolCall,
  ValxosSettings
} from '@valxos/shared';

export interface HookResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  decision?: PermissionDecision;
  reason?: string;
}

export class ExtensionRegistry {
  constructor(
    public readonly settings: ValxosSettings,
    public readonly skills: SkillDefinition[]
  ) {}

  getSkillNames(): string[] {
    return this.skills.map((skill) => skill.frontmatter.name);
  }
}

export function evaluatePermissions(settings: ValxosSettings, toolCall: ToolCall): PermissionDecision {
  const patterns = [
    ...settings.permissions.deny.map((pattern) => ({ decision: 'deny' as const, pattern })),
    ...settings.permissions.allow.map((pattern) => ({ decision: 'allow' as const, pattern })),
    ...settings.permissions.ask.map((pattern) => ({ decision: 'ask' as const, pattern }))
  ];

  const subject = `${toolCall.toolName}(${JSON.stringify(toolCall.input)})`;
  for (const entry of patterns) {
    if (wildcardMatch(subject, entry.pattern)) return entry.decision;
  }
  return 'ask';
}

export async function runHook(hook: HookDefinition, context: HookContext): Promise<HookResult> {
  const child = spawn(hook.command, hook.args ?? [], {
    cwd: hook.cwd,
    env: { ...process.env, ...(hook.env ?? {}) },
    stdio: 'pipe',
    shell: false
  });

  child.stdin.write(JSON.stringify(context));
  child.stdin.end();

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise<number | null>((resolve) => child.on('close', resolve));
  const parsed = safeParseHookJson(stdout);
  return {
    exitCode,
    stdout,
    stderr,
    decision: parsed?.hookSpecificOutput?.permissionDecision,
    reason: parsed?.hookSpecificOutput?.permissionDecisionReason
  };
}

function safeParseHookJson(input: string): any | undefined {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
}

function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function wildcardMatch(subject: string, pattern: string): boolean {
  return wildcardToRegex(pattern).test(subject) || wildcardToRegex(pattern).test(subject.replace(/\s+/g, ' '));
}
