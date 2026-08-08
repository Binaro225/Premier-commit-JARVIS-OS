import { motion, useReducedMotion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

type Props = {
  listening: boolean;
  supported: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
};

export function VoiceInputButton({
  listening,
  supported,
  disabled,
  onToggle,
  onHoldStart,
  onHoldEnd,
}: Props) {
  const reduce = useReducedMotion();
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let held = false;

  const pointerDown = () => {
    if (disabled) return;
    held = false;
    holdTimer = setTimeout(() => {
      held = true;
      onHoldStart();
    }, 350);
  };

  const pointerUp = () => {
    if (holdTimer) clearTimeout(holdTimer);
    if (held) onHoldEnd();
    else if (!disabled) onToggle();
    held = false;
  };

  return (
    <div className="relative flex items-center justify-center">
      {listening && !reduce && (
        <motion.span
          className="absolute rounded-full border border-primary/60"
          style={{ width: 64, height: 64 }}
          animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      )}
      <button
        type="button"
        onPointerDown={pointerDown}
        onPointerUp={pointerUp}
        onPointerLeave={() => {
          if (holdTimer) clearTimeout(holdTimer);
          if (held) onHoldEnd();
          held = false;
        }}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={
          !supported
            ? "Reconnaissance vocale indisponible"
            : listening
              ? "Arrêter l'écoute"
              : "Appuyez pour parler"
        }
        className={`relative flex size-14 min-h-11 min-w-11 items-center justify-center rounded-full border transition-all disabled:opacity-50 ${
          listening
            ? "border-primary bg-primary text-primary-foreground shadow-[0_0_34px_oklch(0.83_0.15_199/45%)]"
            : "border-primary/40 bg-primary/12 text-primary hover:bg-primary/22"
        }`}
      >
        {supported ? <Mic className="size-6" aria-hidden /> : <MicOff className="size-6" aria-hidden />}
      </button>
    </div>
  );
}
