import { Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwa";

export function InstallPwaButton({ full = false }: { full?: boolean }) {
  const { canInstall, installed, install } = usePwaInstall();

  if (installed || !canInstall) return null;

  return (
    <button
      type="button"
      onClick={install}
      aria-label="Installer JARVIS sur cet appareil"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/12 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/22 ${
        full ? "w-full" : ""
      }`}
    >
      <Download className="size-4" aria-hidden />
      Installer JARVIS
    </button>
  );
}
