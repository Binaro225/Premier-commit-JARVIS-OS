import { motion, useReducedMotion } from "framer-motion";

export function LoadingState() {
  const reduce = useReducedMotion();
  return (
    <div className="flex justify-start" aria-label="JARVIS analyse votre demande">
      <div className="glass-panel flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-3">
        <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary/80 uppercase">
          Jarvis
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-primary"
              animate={reduce ? {} : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </span>
        <span className="text-xs text-muted-foreground">analyse…</span>
      </div>
    </div>
  );
}
