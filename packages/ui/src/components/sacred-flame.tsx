import { type ComponentProps, splitProps, Show, createMemo } from "solid-js"

export interface SacredFlameProps extends ComponentProps<"div"> {
  score: number // 0.0 - 1.0
  size?: "small" | "normal" | "large"
  showScore?: boolean
  showLabel?: boolean
}

type FlameLevel = "transcendent" | "cathedral" | "authentic" | "degraded" | "critical"

function getFlameLevel(score: number): FlameLevel {
  if (score >= 0.94) return "transcendent"
  if (score >= 0.88) return "cathedral"
  if (score >= 0.7) return "authentic"
  if (score >= 0.5) return "degraded"
  return "critical"
}

function getFlameLabel(level: FlameLevel): string {
  switch (level) {
    case "transcendent":
      return "Transcendent"
    case "cathedral":
      return "Cathedral"
    case "authentic":
      return "Authentic"
    case "degraded":
      return "Degraded"
    case "critical":
      return "Critical"
  }
}

export function SacredFlame(props: SacredFlameProps) {
  const [split, rest] = splitProps(props, ["score", "size", "showScore", "showLabel", "class", "classList"])

  const level = createMemo(() => getFlameLevel(split.score))
  const label = createMemo(() => getFlameLabel(level()))
  const displayScore = createMemo(() => (split.score * 10).toFixed(1))

  return (
    <div
      {...rest}
      data-component="sacred-flame"
      data-level={level()}
      data-size={split.size || "normal"}
      classList={{
        ...(split.classList ?? {}),
        [split.class ?? ""]: !!split.class,
      }}
      title={`Sacred Flame: ${displayScore()} (${label()})`}
    >
      <span data-slot="flame-icon" aria-hidden="true" />
      <Show when={split.showScore}>
        <span data-slot="flame-score">{displayScore()}</span>
      </Show>
      <Show when={split.showLabel}>
        <span data-slot="flame-label">{label()}</span>
      </Show>
    </div>
  )
}

export interface FlameScoreBadgeProps extends ComponentProps<"span"> {
  score: number
}

export function FlameScoreBadge(props: FlameScoreBadgeProps) {
  const [split, rest] = splitProps(props, ["score", "class", "classList"])
  const level = createMemo(() => getFlameLevel(split.score))

  return (
    <span
      {...rest}
      data-component="flame-score-badge"
      data-level={level()}
      classList={{
        ...(split.classList ?? {}),
        [split.class ?? ""]: !!split.class,
      }}
    >
      {(split.score * 10).toFixed(1)}
    </span>
  )
}
