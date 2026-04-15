import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { PluginManifest, SkillDefinition, SkillFrontmatter } from '@valxos/shared';

export function discoverClaudeSkills(cwd: string): SkillDefinition[] {
  const skillsRoot = path.join(cwd, '.claude', 'skills');
  if (!fs.existsSync(skillsRoot)) return [];

  const folders = fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  return folders.flatMap((folder) => {
    const skillPath = path.join(skillsRoot, folder.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return [];
    const raw = fs.readFileSync(skillPath, 'utf8');
    const parsed = matter(raw);
    return [
      {
        path: skillPath,
        frontmatter: parsed.data as SkillFrontmatter,
        body: parsed.content.trim()
      }
    ];
  });
}

export function discoverClaudePlugins(cwd: string): Array<{ root: string; manifest: PluginManifest }> {
  const entries = fs.readdirSync(cwd, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const hits: Array<{ root: string; manifest: PluginManifest }> = [];

  for (const entry of entries) {
    const manifestPath = path.join(cwd, entry.name, '.claude-plugin', 'plugin.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PluginManifest;
    hits.push({ root: path.join(cwd, entry.name), manifest });
  }

  const pluginAtRoot = path.join(cwd, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(pluginAtRoot)) {
    hits.push({ root: cwd, manifest: JSON.parse(fs.readFileSync(pluginAtRoot, 'utf8')) as PluginManifest });
  }

  return hits;
}

export function getSkillPromptPreview(skills: SkillDefinition[]): string[] {
  return skills.map((skill) => `${skill.frontmatter.name}: ${skill.frontmatter.description}`);
}

export function resolveClaudePluginEnv(pluginRoot: string): Record<string, string> {
  return { CLAUDE_PLUGIN_ROOT: pluginRoot };
}
