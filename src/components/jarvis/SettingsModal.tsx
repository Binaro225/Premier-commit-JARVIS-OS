import { useEffect, useState } from "react";
import { Loader2, Volume2, X } from "lucide-react";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { InstallPwaButton } from "./InstallPwaButton";
import type { Settings } from "@/lib/jarvisStore";
import { pingWebhook, N8N_WEBHOOK_URL } from "@/lib/jarvisApi";
import { pingTts } from "@/lib/tts";

type Status = "ok" | "down" | "unknown";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onTestVoice: () => void;
  onClearHistory: () => void;
};

export function SettingsModal({
  open,
  onClose,
  settings,
  onChange,
  onTestVoice,
  onClearHistory,
}: Props) {
  const [n8n, setN8n] = useState<Status>("unknown");
  const [tts, setTts] = useState<Status>("unknown");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      return;
    }
    setN8n(N8N_WEBHOOK_URL ? "unknown" : "down");
    setTts("unknown");
    let alive = true;
    if (N8N_WEBHOOK_URL) void pingWebhook().then((ok) => alive && setN8n(ok ? "ok" : "down"));
    void pingTts().then((ok) => alive && setTts(ok ? "ok" : "down"));
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Paramètres de JARVIS"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-panel w-full max-w-sm rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm tracking-[0.22em] text-primary uppercase">
            Paramètres
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer les paramètres"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
            <span className="text-sm">Voix activée</span>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => onChange({ voiceEnabled: e.target.checked })}
              className="size-5 accent-[var(--primary)]"
              aria-label="Activer la voix de JARVIS"
            />
          </label>

          <button
            type="button"
            onClick={onTestVoice}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/12 text-sm font-medium text-primary hover:bg-primary/22"
          >
            <Volume2 className="size-4" aria-hidden />
            Tester la voix
          </button>

          <label className="flex min-h-11 cursor-pointer items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
            <span className="pr-3 text-sm">
              Envoyer automatiquement la transcription
              <span className="block text-xs text-muted-foreground">
                Désactivé : la transcription attend votre confirmation.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.autoSendVoice}
              onChange={(e) => onChange({ autoSendVoice: e.target.checked })}
              className="size-5 shrink-0 accent-[var(--primary)]"
              aria-label="Envoyer automatiquement la transcription vocale"
            />
          </label>

          <InstallPwaButton full />

          <div className="space-y-2 pt-1">
            <ConnectionIndicator label="Agent n8n" status={n8n} />
            <ConnectionIndicator label="Service vocal" status={tts} />
          </div>

          {confirming ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <p className="mb-2 text-xs">Effacer définitivement la conversation ?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearHistory();
                    setConfirming(false);
                  }}
                  className="min-h-11 flex-1 rounded-lg bg-destructive text-sm font-medium text-destructive-foreground"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-11 flex-1 rounded-lg border border-border text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-11 w-full rounded-xl border border-destructive/35 text-sm text-destructive hover:bg-destructive/10"
            >
              Effacer l'historique de conversation
            </button>
          )}

          {n8n === "unknown" && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" aria-hidden /> Vérification des services…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
