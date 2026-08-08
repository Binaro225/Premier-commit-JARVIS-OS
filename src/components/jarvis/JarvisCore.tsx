import { motion, useReducedMotion } from "framer-motion";

export type CoreState = "idle" | "listening" | "processing" | "speaking" | "error";

const ACCENT: Record<CoreState, string> = {
  idle: "var(--primary)",
  listening: "var(--primary)",
  processing: "var(--violet)",
  speaking: "var(--primary)",
  error: "var(--destructive)",
};

const LABEL: Record<CoreState, string> = {
  idle: "Système en veille active",
  listening: "Écoute en cours",
  processing: "JARVIS analyse…",
  speaking: "JARVIS parle",
  error: "Anomalie détectée",
};

export function JarvisCore({ state, size = 200 }: { state: CoreState; size?: number }) {
  const reduce = useReducedMotion();
  const accent = ACCENT[state];
  const intensity = state === "listening" || state === "speaking" ? 1 : state === "error" ? 0.8 : 0.5;

  const spin = (duration: number, reverse = false) =>
    reduce
      ? {}
      : {
          animate: { rotate: reverse ? -360 : 360 },
          transition: { duration, repeat: Infinity, ease: "linear" as const },
        };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Noyau JARVIS — ${LABEL[state]}`}
    >
      {/* Lueur */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${accent} 45%, transparent) 0%, transparent 68%)`,
        }}
        animate={reduce ? {} : { opacity: [0.35 * intensity, 0.75 * intensity, 0.35 * intensity] }}
        transition={{
          duration: state === "listening" || state === "speaking" ? 1.4 : 4.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Anneau externe technique */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: 0,
          border: `1px solid color-mix(in oklab, ${accent} 40%, transparent)`,
          borderTopColor: accent,
          borderRightColor: "transparent",
        }}
        {...spin(state === "processing" ? 6 : 24)}
      />

      {/* Anneau médian */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.12,
          border: `1px dashed color-mix(in oklab, ${accent} 32%, transparent)`,
        }}
        {...spin(state === "processing" ? 9 : 34, true)}
      />

      {/* Anneau interne pulsé */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.24,
          border: `1.5px solid color-mix(in oklab, ${accent} 65%, transparent)`,
          boxShadow: `0 0 26px color-mix(in oklab, ${accent} 35%, transparent) inset`,
        }}
        animate={reduce ? {} : { scale: [1, 1 + 0.05 * intensity, 1] }}
        transition={{
          duration: state === "speaking" ? 0.9 : state === "listening" ? 1.2 : 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Coeur */}
      <motion.div
        className="rounded-full"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${accent} 85%, white 15%) 0%, color-mix(in oklab, ${accent} 30%, transparent) 70%)`,
          boxShadow: `0 0 40px color-mix(in oklab, ${accent} 50%, transparent)`,
        }}
        animate={reduce ? {} : { opacity: [0.75, 1, 0.75], scale: [0.97, 1.03, 0.97] }}
        transition={{
          duration: state === "speaking" ? 0.7 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Onde sonore (écoute / parole) */}
      {(state === "listening" || state === "speaking") && (
        <div className="pointer-events-none absolute bottom-2 flex items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full"
              style={{ background: accent, height: 6 }}
              animate={reduce ? {} : { height: [5, 6 + ((i * 5) % 18), 5] }}
              transition={{
                duration: 0.6 + i * 0.07,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}

      {/* Particules discrètes */}
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute size-1 rounded-full"
            style={{ background: accent, top: "50%", left: "50%" }}
            animate={{
              x: [0, Math.cos(i * 2.1) * size * 0.42, 0],
              y: [0, Math.sin(i * 2.1) * size * 0.42, 0],
              opacity: [0, 0.7, 0],
            }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
            aria-hidden
          />
        ))}
    </div>
  );
}

export function CoreStatusLabel({ state }: { state: CoreState }) {
  return (
    <p
      className="font-display text-[0.7rem] tracking-[0.32em] text-muted-foreground uppercase"
      aria-live="polite"
    >
      {LABEL[state]}
    </p>
  );
}
