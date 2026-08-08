import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { LoadingState } from "./LoadingState";
import type { Message } from "@/lib/jarvisStore";

type Props = {
  messages: Message[];
  speakingId: string | null;
  processing: boolean;
  onReplay: (message: Message) => void;
  onStop: () => void;
  onRetry: (prompt: string) => void;
};

export function ChatHistory({
  messages,
  speakingId,
  processing,
  onReplay,
  onStop,
  onRetry,
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, processing]);

  return (
    <div
      className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 pb-2"
      role="log"
      aria-live="polite"
      aria-label="Historique de la conversation"
    >
      {messages.map((m) => (
        <ChatMessage
          key={m.id}
          message={m}
          isSpeakingThis={speakingId === m.id}
          onReplay={onReplay}
          onStop={onStop}
          onRetry={onRetry}
        />
      ))}
      {processing && <LoadingState />}
      <div ref={endRef} />
    </div>
  );
}
