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
}
