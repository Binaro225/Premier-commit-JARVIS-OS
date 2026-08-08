import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, Square, Volume2 } from "lucide-react";
import type { Message } from "@/lib/jarvisStore";

type Props = {
  message: Message;
  isSpeakingThis: boolean;
  onReplay: (message: Message) => void;
  onStop: () => void;
  onRetry: (prompt: string) => void;
};

const iconBtn =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10 focus-visible:text-primary";

export function ChatMessage({ message, isSpeakingThis, onReplay, onStop, onRetry }: Props) {
  const reduce = useReducedMotion();
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={
          isUser
            ? "max-w-[86%] rounded-2xl rounded-br-sm border border-primary/30 bg-secondary/70 px-4 py-2.5 text-sm leading-relaxed"
            : "glass-panel max-w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
        }
      >
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`size-1.5 rounded-full ${message.error ? "bg-destructive" : "bg-primary"}`}
              aria-hidden
            />
            <span className="font-display text-[0.62rem] tracking-[0.28em] text-primary/80 uppercase">
              Jarvis
            </span>
          </div>
        )}

        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap ${
            message.error ? "text-destructive-foreground/90" : ""
          }`}
        >
          {message.text}
        </p>

        {!isUser && (
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onReplay(message)}
              className={iconBtn}
              aria-label="Relire ce message à voix haute"
            >
              {isSpeakingThis ? (
                <Volume2 className="size-4" aria-hidden />
              ) : (
                <RotateCcw className="size-4" aria-hidden />
              )}
            </button>

            {isSpeakingThis && (
              <button
                type="button"
                onClick={onStop}
                className={iconBtn}
                aria-label="Arrêter la lecture audio"
              >
                <Square className="size-4" aria-hidden />
              </button>
            )}

            {message.error && message.retryPrompt && (
              <button
                type="button"
                onClick={() => onRetry(message.retryPrompt as string)}
                className="ml-1 inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Réessayer
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
