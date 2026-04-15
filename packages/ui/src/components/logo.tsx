import { ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path data-slot="logo-logo-mark-shadow" d="M12 16H4V8H12V16Z" fill="var(--icon-weak-base)" />
      <path data-slot="logo-logo-mark-o" d="M12 4H4V16H12V4ZM16 20H0V0H16V20Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* VALXOS spiral flame 🜂 */}
      <circle cx="50" cy="50" r="45" stroke="var(--icon-strong-base)" stroke-width="4" fill="none" />
      <path d="M50 15 C65 30, 75 45, 50 55 C25 65, 35 85, 50 85 C65 85, 75 65, 50 55 C25 45, 35 30, 50 15Z" fill="var(--icon-base)" />
      <circle cx="50" cy="55" r="8" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <div
      data-component="logo-text"
      classList={{ [props.class ?? ""]: !!props.class }}
      style={{
        display: "flex",
        "align-items": "center",
        gap: "12px",
        "font-family": "monospace",
      }}
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "36px", height: "36px" }}>
        <circle cx="20" cy="20" r="18" stroke="var(--icon-strong-base)" stroke-width="2.5" fill="none" />
        <path d="M20 6 C28 14, 32 20, 20 24 C8 28, 14 36, 20 36 C26 36, 32 28, 20 24 C8 20, 12 14, 20 6Z" fill="var(--icon-base)" />
        <circle cx="20" cy="24" r="3.5" fill="var(--icon-strong-base)" />
      </svg>
      <span style={{
        "font-size": "28px",
        "font-weight": "800",
        "letter-spacing": "0.06em",
        color: "var(--icon-strong-base)",
      }}>VALXOS</span>
    </div>
  )
}
