import { ReactNode } from "react";
import { POSContext } from "@/hooks/usePOSContext";

interface POSShellProps {
  context: POSContext;
  children: ReactNode;
  header?: ReactNode;
}

/**
 * Standalone POS layout — dark theme, tablet-first, no admin sidebar.
 * Injects brand colors as CSS variables scoped to this shell.
 */
export function POSShell({ context, children, header }: POSShellProps) {
  const brandStyle = {
    // Scoped accent — used by buttons/badges inside the shell
    ["--pos-accent" as any]: context.brand.accent_color || "#D4A5DB",
    ["--pos-primary" as any]: context.brand.primary_color || "#3E1064",
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen w-full bg-zinc-950 text-zinc-100 antialiased flex flex-col"
      style={brandStyle}
    >
      {header && (
        <header className="h-14 shrink-0 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur flex items-center px-4">
          {header}
        </header>
      )}
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
