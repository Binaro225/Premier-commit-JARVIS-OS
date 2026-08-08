import { useEffect, useState, type ReactNode } from "react";
import { Settings2 } from "lucide-react";

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      );
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-display text-sm tabular-nums text-foreground/90" aria-label="Heure locale">
      {time}
    </span>
  );
}

export function AppShell({
  children,
  onOpenSettings,
  systemLabel,
}: {
  children: ReactNode;
  onOpenSettings: () => void;
  systemLabel: string;
}) {
  return (
    <main className="hud-grid relative flex h-[100dvh] flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,oklch(0.83_0.15_199/10%),transparent)]"
        aria-hidden
      />

      <header className="relative flex items-start justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div>
          <h1 className="font-display text-glow text-lg leading-none font-semibold tracking-[0.18em] text-primary">
            JARVIS OS
          </h1>
          <p className="mt-1.5 flex items-center gap-2 text-[0.62rem] tracking-[0.24em] text-muted-foreground uppercase">
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
              <span className="relative size-1.5 rounded-full bg-success" />
            </span>
            {systemLabel}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Clock />
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Ouvrir les paramètres"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Settings2 className="size-[18px]" aria-hidden />
          </button>
        </div>
      </header>

      {children}
    </main>
  );
}
