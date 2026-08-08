import { motion, useReducedMotion } from "framer-motion";

const SUGGESTIONS = [
  "Quelles sont mes dernières ventes ?",
  "Calcule mon bénéfice",
  "Quel est mon stock disponible ?",
  "Résume mes dépenses",
];

export function Suggestions({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="scroll-slim flex gap-2 overflow-x-auto px-4 pb-2"
      aria-label="Suggestions de demandes"
    >
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="min-h-11 shrink-0 rounded-full border border-primary/25 bg-primary/8 px-3.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-40"
        >
          {s}
        </button>
      ))}
    </motion.div>
  );
}
