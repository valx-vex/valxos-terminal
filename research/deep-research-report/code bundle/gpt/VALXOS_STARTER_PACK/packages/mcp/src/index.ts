import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import type { McpServerConfig } from '@valxos/shared';

export interface McpConnection {
  name: string;
  process?: ChildProcessWithoutNullStreams;
  config: McpServerConfig;
}

export class StdioMcpHost {
  private connections = new Map<string, McpConnection>();

  async attach(name: string, config: McpServerConfig): Promise<McpConnection> {
    if (config.type !== 'stdio' || !config.command) {
      throw new Error(`Only stdio MCP is implemented in starter pack for ${name}`);
    }

    const child = spawn(config.command, config.args ?? [], {
      cwd: config.cwd,
      env: { ...process.env, ...(config.env ?? {}) },
      stdio: 'pipe',
      shell: false
    });

    const connection: McpConnection = { name, process: child, config };
    this.connections.set(name, connection);
    return connection;
  }

  list(): string[] {
    return [...this.connections.keys()];
  }

  async detach(name: string): Promise<void> {
    const connection = this.connections.get(name);
    if (!connection?.process) return;
    connection.process.kill();
    this.connections.delete(name);
  }
}
