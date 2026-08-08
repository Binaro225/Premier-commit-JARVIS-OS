/**
 * Communication avec le webhook n8n.
 * Aucune clé secrète ici : uniquement des URLs publiques via variables d'env.
 *
 * CORS : l'agent n8n doit autoriser le domaine Render du frontend
 * (Access-Control-Allow-Origin) sinon le navigateur bloquera la requête.
 */

export const N8N_WEBHOOK_URL = (import.meta.env["VITE_N8N_WEBHOOK_URL"] as string | undefined) ?? "";

const SESSION_KEY = "jarvis.sessionId";

export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Retire les artefacts Markdown / décoratifs avant affichage et avant TTS. */
export function cleanText(input: unknown): string {
  let text = typeof input === "string" ? input : "";
  text = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)[*_]([^*_]+)[*_]/g, "$1$2")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/[#*_~|]+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

export type JarvisReply = { output: string; tts: string };

export const GENERIC_ERROR =
  "Je ne parviens pas à joindre JARVIS pour le moment. Vérifiez votre connexion puis réessayez.";

function extract(raw: unknown): { output?: string | undefined; tts?: string | undefined } {
  if (!raw) return {};
  if (Array.isArray(raw)) return extract(raw[0]);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extract(JSON.parse(trimmed));
      } catch {
        return { output: raw };
      }
    }
    return { output: raw };
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const nested = obj["data"] ?? obj["json"] ?? obj["result"] ?? obj["body"];
    const direct = {
      output:
        typeof obj["output"] === "string"
          ? (obj["output"] as string)
          : typeof obj["text"] === "string"
            ? (obj["text"] as string)
            : typeof obj["message"] === "string"
              ? (obj["message"] as string)
              : undefined,
      tts: typeof obj["tts"] === "string" ? (obj["tts"] as string) : undefined,
    };
    if (direct.output || direct.tts) return direct;
    if (nested) return extract(nested);
  }
  return {};
}

export async function askJarvis(message: string, timeoutMs = 45000): Promise<JarvisReply> {
  if (!N8N_WEBHOOK_URL) throw new Error("missing-webhook");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sessionId: getSessionId(),
        source: "jarvis-os-pwa",
        language: "fr",
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`http-${res.status}`);

    const rawBody = await res.text();
    let parsed: unknown = rawBody;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      /* texte brut */
    }

    const { output, tts } = extract(parsed);
    const cleanOutput = cleanText(output ?? tts ?? "");
    const cleanTts = cleanText(tts ?? output ?? "");

    if (!cleanOutput && !cleanTts) throw new Error("empty-response");

    return {
      output: cleanOutput || cleanTts,
      tts: cleanTts || cleanOutput,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function pingWebhook(): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(N8N_WEBHOOK_URL, { method: "OPTIONS", signal: controller.signal });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}
