import { WifiOff } from "lucide-react";
import { motion } from "framer-motion";

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-energy/40 bg-energy/10 px-3 py-2 text-xs text-foreground"
    >
      <WifiOff className="size-4 shrink-0 text-energy" aria-hidden />
      Vous êtes hors ligne. JARVIS reste disponible dès que la connexion revient.
    </motion.div>
  );
}
