export type AssistantMode = "chat" | "voice";
export const OPEN_ASSISTANT_EVENT = "nofa:open-assistant";
export const PLAY_DEMO_CALL_EVENT = "nofa:play-demo-call";

export interface OpenAssistantDetail {
  mode: AssistantMode;
  prompt?: string; // first chat message to send
}

/** Open the floating assistant from anywhere on the page. */
export function openAssistant(mode: AssistantMode = "chat", prompt?: string) {
  window.dispatchEvent(new CustomEvent<OpenAssistantDetail>(OPEN_ASSISTANT_EVENT, { detail: { mode, prompt } }));
}

/**
 * Play the audible demo call in the hero card. Call from a click handler —
 * the listener runs synchronously, so audio is unlocked by this same click.
 */
export function playDemoCall() {
  window.dispatchEvent(new CustomEvent(PLAY_DEMO_CALL_EVENT));
}
