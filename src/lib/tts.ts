/**
 * Synthèse vocale JARVIS.
 * Priorité au backend TTS Render. speechSynthesis est utilisé uniquement en secours.
 * Une seule lecture peut être active à la fois.
 */

export const TTS_API_URL =
  (import.meta.env["VITE_TTS_API_URL"] as string | undefined) ??
  "https://jarvis-tts-backend.onrender.com/tts";

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let playbackId = 0;
let fallbackActive = false;

function releaseCurrent() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }

  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

export function stopSpeech() {
  playbackId += 1;
  fallbackActive = false;
  releaseCurrent();

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function speakFallback(
  text: string,
  requestId: number,
  onEnd: () => void,
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  try {
    fallbackActive = true;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1;
    utterance.pitch = 1;

    const finishFallback = () => {
      if (requestId !== playbackId) return;

      fallbackActive = false;
      onEnd();
    };

    utterance.onend = finishFallback;
    utterance.onerror = finishFallback;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return true;
  } catch {
    fallbackActive = false;
    return false;
  }
}

async function resolveAudioSource(res: Response): Promise<string | null> {
  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();

  if (contentType.includes("application/json")) {
    const data = (await res.json()) as Record<string, unknown>;

    const url =
      (data["audioUrl"] as string | undefined) ??
      (data["audio_url"] as string | undefined) ??
      (data["url"] as string | undefined);

    if (typeof url === "string" && url.trim()) {
      return url.trim();
    }

    const base64 =
      (data["audioContent"] as string | undefined) ??
      (data["base64"] as string | undefined);

    if (typeof base64 === "string" && base64.trim()) {
      const cleanBase64 = base64.trim();

      return cleanBase64.startsWith("data:")
        ? cleanBase64
        : `data:audio/mpeg;base64,${cleanBase64}`;
    }

    return null;
  }

  if (contentType.startsWith("text/")) {
    const text = (await res.text()).trim();

    if (/^https?:\/\//i.test(text) || text.startsWith("data:audio")) {
      return text;
    }

    return null;
  }

  const blob = await res.blob();

  if (blob.size < 256) {
    return null;
  }

  const objectUrl = URL.createObjectURL(blob);
  currentUrl = objectUrl;

  return objectUrl;
}

/**
 * Lance une seule lecture TTS.
 * Si une autre demande arrive pendant le chargement, l'ancienne est ignorée.
 */
export async function speak(
  text: string,
  opts: { onStart?: () => void; onEnd?: () => void } = {},
): Promise<boolean> {
  const clean = text.replace(/\s+/g, " ").trim();

  if (!clean) {
    return false;
  }

  stopSpeech();

  const requestId = playbackId;

  const finish = () => {
    if (requestId !== playbackId) return;

    releaseCurrent();
    fallbackActive = false;
    opts.onEnd?.();
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: clean,
        language: "fr",
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`tts-${response.status}`);
    }

    const source = await resolveAudioSource(response);

    if (!source) {
      throw new Error("tts-empty");
    }

    if (requestId !== playbackId) {
      return false;
    }

    const audio = new Audio(source);
    audio.preload = "auto";
    currentAudio = audio;

    audio.onended = finish;
    audio.onerror = finish;

    opts.onStart?.();

    await audio.play();

    return true;
  } catch {
    if (requestId !== playbackId) {
      return false;
    }

    releaseCurrent();

    const fallbackStarted = speakFallback(clean, requestId, finish);

    if (fallbackStarted) {
      opts.onStart?.();
      return true;
    }

    opts.onEnd?.();
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function pingTts(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(TTS_API_URL, {
      method: "OPTIONS",
      signal: controller.signal,
    });

    return response.status < 500;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
