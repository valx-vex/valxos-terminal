import fs from 'node:fs';
import path from 'node:path';
import type { ValxosSettings, HookDefinition, McpServerConfig } from '@valxos/shared';

const defaultSettings: ValxosSettings = {
  env: {},
  permissions: { allow: [], deny: [], ask: [] },
  hooks: [],
  mcpServers: {},
  rules: []
};

function readJsonIfExists<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function mergeObjects<T extends Record<string, any>>(base: T, next?: Partial<T>): T {
  if (!next) return base;
  const output: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(next)) {
    const current = output[key];
    if (Array.isArray(current) && Array.isArray(value)) {
      output[key] = unique([...current, ...value]);
    } else if (
      current &&
      value &&
      typeof current === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(current) &&
      !Array.isArray(value)
    ) {
      output[key] = mergeObjects(current, value);
    } else {
      output[key] = value;
    }
  }
  return output as T;
}

export interface LoadConfigInput {
  cwd: string;
  homeDir?: string;
  cli?: Partial<ValxosSettings>;
  managedPath?: string;
}

export interface LoadedConfig {
  managedPath?: string;
  files: Record<string, string | undefined>;
  settings: ValxosSettings;
  claudeMd?: string;
}

export function loadValxosConfig(input: LoadConfigInput): LoadedConfig {
  const homeDir = input.homeDir ?? process.env.HOME ?? process.cwd();
  const managedPath = input.managedPath;
  const userPath = path.join(homeDir, '.claude', 'settings.json');
  const projectPath = path.join(input.cwd, '.claude', 'settings.json');
  const localPath = path.join(input.cwd, '.claude', 'settings.local.json');
  const claudeMdPath = path.join(input.cwd, 'CLAUDE.md');

  const managed = managedPath ? readJsonIfExists<Partial<ValxosSettings>>(managedPath) : undefined;
  const user = readJsonIfExists<Partial<ValxosSettings>>(userPath);
  const project = readJsonIfExists<Partial<ValxosSettings>>(projectPath);
  const local = readJsonIfExists<Partial<ValxosSettings>>(localPath);
  const claudeMd = fs.existsSync(claudeMdPath) ? fs.readFileSync(claudeMdPath, 'utf8') : undefined;

  const merged = [managed, user, project, local, input.cli].reduce(
    (acc, part) => mergeObjects(acc, part),
    structuredClone(defaultSettings)
  );

  merged.permissions.allow = unique(merged.permissions.allow);
  merged.permissions.deny = unique(merged.permissions.deny);
  merged.permissions.ask = unique(merged.permissions.ask);

  return {
    managedPath,
    files: { userPath, projectPath, localPath, claudeMdPath },
    settings: merged,
    claudeMd
  };
}

export function normalizeHookDefinitions(raw: unknown): HookDefinition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((item) => item as HookDefinition);
}

export function normalizeMcpServers(raw: unknown): Record<string, McpServerConfig> {
  if (!raw || typeof raw !== 'object') return {};
  return raw as Record<string, McpServerConfig>;
}
