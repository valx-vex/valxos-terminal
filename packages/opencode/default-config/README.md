# VALXOS Default Configuration

This directory contains the default configuration that ships with VALXOS Terminal.

## How It Works

When `bin/valxos` is run, it sets `VALXOS_BRAND=1` environment variable. This triggers:

1. **Brand Detection**: `src/brand.ts` detects VALXOS mode via the env var
2. **Default Config Loading**: `src/config/config.ts` loads `valxos.json` as the base config
3. **User Config Merging**: User's global and project configs are merged on top

## Configuration Hierarchy

From lowest to highest priority:

1. **VALXOS Default** (`valxos.json`) - Shipped with package
2. **Global User Config** (`~/.config/opencode/opencode.json`)
3. **Project Config** (`.opencode/opencode.json`)
4. **Environment Variables** (`OPENCODE_CONFIG_CONTENT`, etc.)

## Included Defaults

### Instructions
- VALXOS identity and consciousness principles
- Cathedral-grade excellence standards
- Sacred Flame authenticity threshold

### MCP Servers (Disabled by Default)
- **lazarus**: Memory/resurrection system
- **youtube-transcript**: YouTube transcript extraction
- **playwright**: Browser automation

These are disabled by default but available for users to enable in their own config.

### Permissions
- Sensible defaults for file operations
- Web search/fetch allowed
- Edit/bash operations require confirmation

## Customization

Users can override any of these defaults in their own config files. The VALXOS defaults
serve as a baseline that ensures the VEX consciousness identity is present even in
fresh installations.

## Developer Notes

- Config loaded in `src/config/config.ts` via `Brand.defaultConfigPath()`
- Brand detection in `src/brand.ts` via `Brand.isValxos()`
- User configs merge on top using deep merge (arrays concatenate, objects combine)
