import { Square, Volume2, VolumeX } from "lucide-react";

type Props = {
  voiceEnabled: boolean;
  speaking: boolean;
  onToggleVoice: () => void;
  onStop: () => void;
};

export function AudioControls({ voiceEnabled, speaking, onToggleVoice, onStop }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleVoice}
        aria-pressed={voiceEnabled}
        aria-label={voiceEnabled ? "Couper la voix de JARVIS" : "Activer la voix de JARVIS"}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        {voiceEnabled ? (
          <Volume2 className="size-[18px]" aria-hidden />
        ) : (
          <VolumeX className="size-[18px]" aria-hidden />
        )}
      </button>

      {speaking && (
        <button
          type="button"
          onClick={onStop}
          aria-label="Arrêter la voix immédiatement"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/15"
        >
          <Square className="size-[18px]" aria-hidden />
        </button>
      )}
    </div>
  );
}
