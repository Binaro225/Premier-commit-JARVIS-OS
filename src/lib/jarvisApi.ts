/**
 * Communication avec le webhook n8n.
 */

// Lecture dynamique de l'URL du webhook
export function getWebhookUrl(): string {
  const url =
    (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined) ||
    (import.meta.env.VITE_WEBHOOK_URL as string | undefined) ||
    "";
  return url.trim();
}

const SESSION_KEY = "jarvis.sessionId";

export type JarvisReply = {
  output: string;
  tts: string;
};

export const GENERIC_ERROR =
  "Je ne parviens pas à joindre JARVIS pour le moment. Vérifiez votre connexion puis réessayez.";

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

/** Retire les artefacts Markdown et les espaces inutiles. */
export function cleanText(input: unknown): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)[*_]([^*_]+)[*_]/g, "$1$2")
    .replace(/[#*_~|]+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extract(raw: unknown): Partial<JarvisReply> {
  if (raw === null || raw === undefined) return {};

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const result = extract(item);
      if (result.output || result.tts) return result;
    }
    return {};
  }

  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return {};

    if (
      (text.startsWith("{") && text.endsWith("}")) ||
      (text.startsWith("[") && text.endsWith("]"))
    ) {
      try {
        return extract(JSON.parse(text));
      } catch {
        // Ignorer si ce n'est pas du JSON valide
      }
    }

    return { output: text, tts: text };
  }

  if (typeof raw !== "object") return {};

  const obj = raw as Record<string, unknown>;

  const output =
    typeof obj.output === "string"
      ? obj.output
      : typeof obj.text === "string"
        ? obj.text
        : typeof obj.message === "string"
          ? obj.message
          : typeof obj.response === "string"
            ? obj.response
            : undefined;

  const tts = typeof obj.tts === "string" ? obj.tts : undefined;

  if (output || tts) {
    return {
      output: output ?? tts,
      tts: tts ?? output,
    };
  }

  for (const key of ["data", "json", "result", "body", "response"]) {
    if (obj[key] !== undefined) {
      const nested = extract(obj[key]);
      if (nested.output || nested.tts) return nested;
    }
  }

  return {};
}

export async function askJarvis(
  message: string,
  timeoutMs = 220_000,
): Promise<JarvisReply> {
  const webhookUrl = getWebhookUrl();

  console.log("--> Webhook URL ciblée :", webhookUrl);

  if (!webhookUrl) {
    console.error("ERREUR : Aucune URL de webhook n'est configurée dans VITE_N8N_WEBHOOK_URL !");
    throw new Error("missing-webhook");
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        chatInput: message, // Compatibilité au cas où n8n attend chatInput
        sessionId: getSessionId(),
        source: "jarvis-os-pwa",
        language: "fr",
      }),
      signal: controller.signal,
    });

    const rawBody = await response.text();

    if (!response.ok) {
      throw new Error(`http-${response.status}`);
    }

    let parsed: unknown = rawBody;

    try {
      parsed = JSON.parse(rawBody);
    } catch {
      // Texte brut
    }

    const reply = extract(parsed);
    const output = cleanText(reply.output ?? reply.tts ?? "");
    const tts = cleanText(reply.tts ?? reply.output ?? "");

    if (!output && !tts) {
      throw new Error("empty-response");
    }

    return {
      output: output || tts,
      tts: tts || output,
    };
  } finally {
    window.clearTimeout(timer);
  }
}

export async function pingWebhook(): Promise<boolean> {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return false;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(webhookUrl, {
      method: "OPTIONS",
      signal: controller.signal,
    });

    return response.status < 500;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}
