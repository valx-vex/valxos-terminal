#!/usr/bin/env node
import path from 'node:path';
import minimist from 'minimist';
import { discoverClaudePlugins, discoverClaudeSkills, getSkillPromptPreview } from '@valxos/compat';
import { loadValxosConfig } from '@valxos/config';
import { buildUniversalMessage, createHandoverFile, decideRoute } from '@valxos/control-plane';
import { evaluatePermissions, ExtensionRegistry } from '@valxos/extensions';
import { StdioMcpHost } from '@valxos/mcp';
import { createDefaultAdapters } from '@valxos/providers';
import type { ProviderId } from '@valxos/shared';

async function main() {
  const args = minimist(process.argv.slice(2));
  const command = args._[0] ?? 'doctor';
  const cwd = path.resolve(args.cwd ?? process.cwd());
  const config = loadValxosConfig({ cwd });
  const skills = discoverClaudeSkills(cwd);
  const plugins = discoverClaudePlugins(cwd);
  const registry = new ExtensionRegistry(config.settings, skills);

  if (command === 'doctor') {
    console.log(JSON.stringify({
      cwd,
      skillCount: skills.length,
      skillPreview: getSkillPromptPreview(skills),
      pluginCount: plugins.length,
      permissions: config.settings.permissions,
      mcpServers: Object.keys(config.settings.mcpServers),
      claudeMdLoaded: Boolean(config.claudeMd)
    }, null, 2));
    return;
  }

  if (command === 'route') {
    const prompt = String(args.prompt ?? 'Implement a feature and run tests.');
    const decision = decideRoute({
      prompt,
      providerHint: args.provider as ProviderId | undefined,
      contextSize: args.contextSize,
      requireLocal: Boolean(args.local),
      costSensitivity: args.costSensitivity,
      needsCoding: true,
      needsSearch: Boolean(args.search)
    });
    console.log(JSON.stringify(decision, null, 2));
    return;
  }

  if (command === 'start') {
    const prompt = String(args.prompt ?? 'Describe current repository and active skills.');
    const decision = decideRoute({
      prompt,
      providerHint: args.provider as ProviderId | undefined,
      contextSize: args.contextSize,
      requireLocal: Boolean(args.local),
      costSensitivity: args.costSensitivity,
      needsCoding: true
    });
    const adapters = createDefaultAdapters();
    const system = [
      config.claudeMd ?? '',
      'Respect clean-room compatibility surfaces only.',
      `Available skills: ${registry.getSkillNames().join(', ') || 'none'}`
    ].filter(Boolean);
    const um = buildUniversalMessage({
      sessionId: 'starter-session',
      cwd,
      provider: decision.primary,
      system,
      prompt,
      tools: skills.map((skill) => ({
        name: skill.frontmatter.name,
        description: skill.frontmatter.description
      }))
    });
    const response = await adapters[decision.primary].send(um);
    console.log(JSON.stringify({ route: decision, response }, null, 2));
    return;
  }

  if (command === 'permission') {
    const toolName = String(args.tool ?? 'Bash');
    const toolInput = args.input ?? 'npm test';
    const decision = evaluatePermissions(config.settings, { toolName, input: toolInput });
    console.log(JSON.stringify({ toolName, toolInput, decision }, null, 2));
    return;
  }

  if (command === 'mcp:list') {
    const host = new StdioMcpHost();
    console.log(JSON.stringify({ configured: Object.keys(config.settings.mcpServers), attached: host.list() }, null, 2));
    return;
  }

  if (command === 'handover') {
    const from = (args.from ?? 'openai') as ProviderId;
    const to = (args.to ?? 'anthropic') as ProviderId;
    console.log(createHandoverFile({
      sessionId: 'starter-session',
      from,
      to,
      summary: 'Starter pack handover artifact.',
      openThreads: ['Implement provider adapters', 'Add real TUI'],
      toolState: { cwd }
    }));
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
