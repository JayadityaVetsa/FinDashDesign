"use client";

type WidgetCardProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  noPadding?: boolean;
};

export default function WidgetCard({
  title,
  children,
  actions,
  noPadding,
}: WidgetCardProps) {
  return (
    <div className="group/card flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-sm transition-shadow hover:shadow-md">
      {/* Drag handle header */}
      <div className="widget-handle flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Grip icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            className="shrink-0 text-[var(--muted-foreground)] opacity-40 transition-opacity group-hover/card:opacity-80"
          >
            <circle cx="4" cy="3" r="1.5" fill="currentColor" />
            <circle cx="4" cy="8" r="1.5" fill="currentColor" />
            <circle cx="4" cy="13" r="1.5" fill="currentColor" />
            <circle cx="11" cy="3" r="1.5" fill="currentColor" />
            <circle cx="11" cy="8" r="1.5" fill="currentColor" />
            <circle cx="11" cy="13" r="1.5" fill="currentColor" />
          </svg>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            {title}
          </h2>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {/* Body */}
      <div className={`flex-1 overflow-auto ${noPadding ? "" : "p-4"}`}>
        {children}
      </div>
    </div>
  );
}
