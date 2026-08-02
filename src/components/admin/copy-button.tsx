"use client";

export function CopyButton({ text, label = "Copy URL" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text)}
      className="shrink-0 text-xs border px-2 py-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      aria-label={label}
    >
      {label}
    </button>
  );
}
