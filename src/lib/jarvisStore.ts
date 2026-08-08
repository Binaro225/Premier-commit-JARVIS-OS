export type Role = "user" | "jarvis";

export type Message = {
  id: string;
  role: Role;
  text: string;
  tts?: string;
  at: number;
  error?: boolean;
  retryPrompt?: string;
};

export type Settings = {
  voiceEnabled: boolean;
  autoSendVoice: boolean;
};

const HISTORY_KEY = "jarvis.history";
const SETTINGS_KEY = "jarvis.settings";

export const WELCOME_TEXT = "Bonjour. Je suis JARVIS. Comment puis-je vous aider ?";

export const DEFAULT_SETTINGS: Settings = { voiceEnabled: true, autoSendVoice: true };

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function welcomeMessage(): Message {
  return { id: newId(), role: "jarvis", text: WELCOME_TEXT, tts: WELCOME_TEXT, at: Date.now() };
}

export function loadHistory(): Message[] {
  if (typeof window === "undefined") return [welcomeMessage()];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [welcomeMessage()];
    const parsed = JSON.parse(raw) as Message[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [welcomeMessage()];
    return parsed.slice(-60);
  } catch {
    return [welcomeMessage()];
  }
}

export function saveHistory(messages: Message[]) {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-60)));
  } catch {
    /* quota */
  }
}

export function clearHistory() {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* noop */
  }
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* noop */
  }
}
