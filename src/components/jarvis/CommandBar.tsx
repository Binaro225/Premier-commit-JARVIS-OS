import { Send } from "lucide-react";
import { VoiceInputButton } from "./VoiceInputButton";
import { AudioControls } from "./AudioControls";
import type { CoreState } from "./JarvisCore";

const HINT: Record<CoreState, string> = {
  idle: "Appuyez pour parler",
  listening: "Écoute en cours",
  processing: "JARVIS analyse",
  speaking: "JARVIS parle",
  error: "Appuyez pour parler",
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  state: CoreState;
  listening: boolean;
  micSupported: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStopAudio: () => void;
  onMicToggle: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
};

export function CommandBar({
  value,
  onChange,
  onSend,
  state,
  listening,
  micSupported,
  voiceEnabled,
  onToggleVoice,
  onStopAudio,
  onMicToggle,
  onHoldStart,
  onHoldEnd,
}: Props) {
  const speaking = state === "speaking";

  return (
    <div className="glass-panel rounded-t-3xl border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mb-2 flex items-center justify-between">
        <span
          className="font-display text-[0.62rem] tracking-[0.26em] text-muted-foreground uppercase"
          aria-live="polite"
        >
          {HINT[state]}
        </span>
        <AudioControls
          voiceEnabled={voiceEnabled}
          speaking={speaking}
          onToggleVoice={onToggleVoice}
          onStop={onStopAudio}
        />
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <VoiceInputButton
          listening={listening}
          supported={micSupported}
          onToggle={onMicToggle}
          onHoldStart={onHoldStart}
          onHoldEnd={onHoldEnd}
        />

        <label className="flex-1">
          <span className="sr-only">Votre demande pour JARVIS</span>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Parlez ou écrivez votre demande…"
            className="scroll-slim max-h-28 min-h-11 w-full resize-none rounded-2xl border border-input bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={!value.trim() || state === "processing"}
          aria-label="Envoyer la demande"
          className="flex size-12 min-h-11 min-w-11 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
        >
          <Send className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
