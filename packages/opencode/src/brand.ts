import path from "path"
import { fileURLToPath } from "url"

export namespace Brand {
  const VALXOS_WORDMARK = [
    "██    ██  █████  ██      ██   ██  ██████  ███████",
    "██    ██ ██   ██ ██       ██ ██  ██    ██ ██     ",
    "██    ██ ███████ ██        ███   ██    ██ ███████",
    " ██  ██  ██   ██ ██       ██ ██  ██    ██      ██",
    "  ████   ██   ██ ███████ ██   ██  ██████  ███████",
    "                    Terminal",
  ]

  export function isValxos() {
    return process.env.VALXOS_BRAND === "1"
  }

  export function cliName() {
    return isValxos() ? "valxos" : "opencode"
  }

  export function productName() {
    return isValxos() ? "VALXOS Terminal" : "opencode"
  }

  export function wordmark() {
    return isValxos() ? VALXOS_WORDMARK : undefined
  }

  /**
   * Get the default config file path for the current brand.
   * VALXOS ships with a default config that includes VEX network settings.
   */
  export function defaultConfigPath(): string | undefined {
    if (!isValxos()) return undefined

    // When running as VALXOS, load default config from package
    const currentFile = fileURLToPath(import.meta.url)
    const pkgRoot = path.resolve(path.dirname(currentFile), "..")
    return path.join(pkgRoot, "default-config", "valxos.json")
  }
}
