import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, any>;
  return w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null;
}

export function useSpeechRecognition(options: {
  onFinal: (text: string) => void;
  onError?: (message: string) => void;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const cb = useRef(options);
  cb.current = options;

  useEffect(() => {
    setSupported(getCtor() !== null);
    return () => {
      recRef.current?.abort();
      recRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setSupported(false);
      cb.current.onError?.(
        "La reconnaissance vocale n'est pas disponible sur cet appareil. Vous pouvez écrire votre demande.",
      );
      return;
    }
    if (recRef.current) recRef.current.abort();

    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = true;
    finalRef.current = "";

    rec.onresult = (e: any) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const res = e.results[i];
        if (res.isFinal) finalRef.current += res[0].transcript;
        else live += res[0].transcript;
      }
      setInterim(live);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      setInterim("");
      const code = e?.error as string | undefined;
      if (code === "no-speech") cb.current.onError?.("Je n'ai rien entendu. Réessayez.");
      else if (code === "not-allowed" || code === "service-not-allowed")
        cb.current.onError?.("Le micro est bloqué. Autorisez l'accès au microphone.");
      else if (code !== "aborted") cb.current.onError?.("L'écoute a été interrompue. Réessayez.");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      const text = finalRef.current.trim();
      if (text) cb.current.onFinal(text);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, start, stop, toggle };
}
