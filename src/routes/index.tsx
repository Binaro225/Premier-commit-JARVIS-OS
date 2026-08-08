import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/jarvis/AppShell";
import { ChatHistory } from "@/components/jarvis/ChatHistory";
import { CommandBar } from "@/components/jarvis/CommandBar";
import { CoreStatusLabel, JarvisCore, type CoreState } from "@/components/jarvis/JarvisCore";
import { OfflineBanner } from "@/components/jarvis/OfflineBanner";
import { SettingsModal } from "@/components/jarvis/SettingsModal";
import { Suggestions } from "@/components/jarvis/Suggestions";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useOnlineStatus } from "@/hooks/usePwa";
import { askJarvis, cleanText, GENERIC_ERROR } from "@/lib/jarvisApi";
import { speak, stopSpeech } from "@/lib/tts";
import {
  clearHistory,
  loadHistory,
  loadSettings,
  newId,
  saveHistory,
  saveSettings,
  welcomeMessage,
  type Message,
  type Settings,
} from "@/lib/jarvisStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JARVIS OS — Console vocale de votre assistant IA" },
      {
        name: "description",
        content:
          "Parlez ou écrivez à JARVIS depuis une console holographique unique : réponses vocales instantanées, historique local, installable sur Android.",
      },
      { property: "og:title", content: "JARVIS OS — Console vocale de votre assistant IA" },
      {
        property: "og:description",
        content:
          "Une interface futuriste unique pour dialoguer avec votre assistant IA, à la voix comme au clavier.",
      },
    ],
  }),
  component: JarvisScreen,
});

function JarvisScreen() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage()]);
  const [settings, setSettings] = useState<Settings>({ voiceEnabled: true, autoSendVoice: true });
  const [input, setInput] = useState("");
  const [state, setState] = useState<CoreState>("idle");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const online = useOnlineStatus();
  const busyRef = useRef(false);

  useEffect(() => {
    setMessages(loadHistory());
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveHistory(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  useEffect(() => () => stopSpeech(), []);

  const stopAudio = useCallback(() => {
    stopSpeech();
    setSpeakingId(null);
    setState((s) => (s === "speaking" ? "idle" : s));
  }, []);

  const playMessage = useCallback(
    async (message: Message) => {
      const text = cleanText(message.tts ?? message.text);
      if (!text) return;
      stopSpeech();
      setSpeakingId(message.id);
      setState("speaking");
      await speak(text, {
        onEnd: () => {
          setSpeakingId(null);
          setState((s) => (s === "speaking" ? "idle" : s));
        },
      });
    },
    [],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;
      stopAudio();
      setInput("");

      const userMsg: Message = { id: newId(), role: "user", text, at: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setState("processing");

      try {
        const reply = await askJarvis(text);
        const jarvisMsg: Message = {
          id: newId(),
          role: "jarvis",
          text: reply.output,
          tts: reply.tts,
          at: Date.now(),
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        setState("idle");
        if (settings.voiceEnabled) void playMessage(jarvisMsg);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "jarvis",
            text: GENERIC_ERROR,
            at: Date.now(),
            error: true,
            retryPrompt: text,
          },
        ]);
        setState("error");
        setTimeout(() => setState((s) => (s === "error" ? "idle" : s)), 3200);
      } finally {
        busyRef.current = false;
      }
    },
    [playMessage, settings.voiceEnabled, stopAudio],
  );

  const speech = useSpeechRecognition({
    onFinal: (text) => {
      if (settings.autoSendVoice) void send(text);
      else setInput(text);
    },
    onError: (message) => {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "jarvis", text: message, at: Date.now(), error: true },
      ]);
      setState("error");
      setTimeout(() => setState((s) => (s === "error" ? "idle" : s)), 3200);
    },
  });

  useEffect(() => {
    if (speech.listening) setState("listening");
    else setState((s) => (s === "listening" ? "idle" : s));
  }, [speech.listening]);

  const userTurns = useMemo(() => messages.filter((m) => m.role === "user").length, [messages]);

  return (
    <>
      <AppShell
        onOpenSettings={() => setSettingsOpen(true)}
        systemLabel={online ? "Système en ligne" : "Mode hors ligne"}
      >
        <div className="flex shrink-0 flex-col items-center gap-2 pb-2">
          <JarvisCore state={state} size={168} />
          <CoreStatusLabel state={state} />
        </div>

        <OfflineBanner online={online} />

        <ChatHistory
          messages={messages}
          speakingId={speakingId}
          processing={state === "processing"}
          onReplay={(m) => (speakingId === m.id ? stopAudio() : void playMessage(m))}
          onStop={stopAudio}
          onRetry={(prompt) => void send(prompt)}
        />

        {speech.interim && (
          <p className="px-4 pb-1 text-xs text-primary/80 italic" aria-live="polite">
            {speech.interim}
          </p>
        )}

        {userTurns < 3 && (
          <Suggestions onPick={(t) => void send(t)} disabled={state === "processing"} />
        )}

        <CommandBar
          value={input}
          onChange={setInput}
          onSend={() => void send(input)}
          state={state}
          listening={speech.listening}
          micSupported={speech.supported}
          voiceEnabled={settings.voiceEnabled}
          onToggleVoice={() => {
            if (settings.voiceEnabled) stopAudio();
            setSettings((s) => ({ ...s, voiceEnabled: !s.voiceEnabled }));
          }}
          onStopAudio={stopAudio}
          onMicToggle={speech.toggle}
          onHoldStart={speech.start}
          onHoldEnd={speech.stop}
        />
      </AppShell>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        onTestVoice={() =>
          void playMessage({
            id: "test-voice",
            role: "jarvis",
            text: "Test vocal. Tous les systèmes sont opérationnels.",
            at: Date.now(),
          })
        }
        onClearHistory={() => {
          clearHistory();
          stopAudio();
          setMessages([welcomeMessage()]);
        }}
      />
    </>
  );
}
