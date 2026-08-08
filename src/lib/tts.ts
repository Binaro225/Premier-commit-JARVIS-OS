/**
 * Synthèse vocale : appelle le backend TTS, avec repli sur window.speechSynthesis.
 * Un seul audio peut jouer à la fois.
 */

export const TTS_API_URL =
  (import.meta.env["VITE_TTS_API_URL"] as string | undefined) ??
  "https://jarvis-tts-backend.onrender.com/tts";

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

function releaseCurrent() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export function stopSpeech() {
  releaseCurrent();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function speakFallback(text: string, onEnd: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "fr-FR";
    utter.onend = onEnd;
    utter.onerror = onEnd;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

async function resolveAudioSource(res: Response): Promise<string | null> {
  const type = (res.headers.get("content-type") ?? "").toLowerCase();

  if (type.includes("application/json")) {
    const data = (await res.json()) as Record<string, unknown>;
    const url =
      (data["audioUrl"] as string | undefined) ??
      (data["audio_url"] as string | undefined) ??
      (data["url"] as string | undefined);
    if (typeof url === "string" && url) return url;
    const b64 = (data["audioContent"] as string | undefined) ?? (data["base64"] as string | undefined);
    if (typeof b64 === "string" && b64) {
      return b64.startsWith("data:") ? b64 : `data:audio/mpeg;base64,${b64}`;
    }
    return null;
  }

  if (type.startsWith("text/")) {
    const text = (await res.text()).trim();
    if (/^https?:\/\//i.test(text) || text.startsWith("data:audio")) return text;
    return null;
  }

  const blob = await res.blob();
  if (blob.size < 256) return null;
  const objectUrl = URL.createObjectURL(blob);
  currentUrl = objectUrl;
  return objectUrl;
}

/** Lance la lecture. Résout quand l'audio est terminé (ou immédiatement en cas d'échec). */
export async function speak(
  text: string,
  opts: { onStart?: () => void; onEnd?: () => void } = {},
): Promise<boolean> {
  const clean = text.trim();
  if (!clean) return false;

  stopSpeech();

  const finish = () => {
    releaseCurrent();
    opts.onEnd?.();
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(TTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, language: "fr" }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`tts-${res.status}`);

    const src = await resolveAudioSource(res);
    if (!src) throw new Error("tts-empty");

    const audio = new Audio(src);
    audio.preload = "auto";
    currentAudio = audio;
    audio.onended = finish;
    audio.onerror = finish;
    opts.onStart?.();
    await audio.play();
    return true;
  } catch {
    // Repli navigateur si le backend TTS est indisponible.
    releaseCurrent();
    const ok = speakFallback(clean, finish);
    if (ok) opts.onStart?.();
    else opts.onEnd?.();
    return ok;
  }
}

export async function pingTts(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(TTS_API_URL, { method: "OPTIONS", signal: controller.signal });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}
