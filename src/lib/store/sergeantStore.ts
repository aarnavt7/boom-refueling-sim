"use client";

import { create } from "zustand";

import {
  createSergeantWelcomeMessage,
  SERGEANT_SESSION_VERSION,
  SERGEANT_STORAGE_KEY,
  type SergeantContextSnapshot,
  type SergeantConversationState,
  type SergeantConversationStatus,
  type SergeantMessage,
  type SergeantPausedOnboardingContext,
} from "@/lib/sergeant/types";

type PersistedSergeantState = SergeantConversationState;

type SergeantStore = SergeantConversationState & {
  hasHydrated: boolean;
  hydrateFromStorage: () => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  setDraft: (draft: string) => void;
  setStatus: (status: SergeantConversationStatus) => void;
  setLastContextSnapshot: (snapshot: SergeantContextSnapshot | null) => void;
  appendMessage: (message: SergeantMessage) => void;
  appendSystemMessage: (content: string) => void;
  clearConversation: () => void;
  setPausedOnboardingContext: (context: SergeantPausedOnboardingContext | null) => void;
  setHasUnreadSystemHint: (value: boolean) => void;
};

function createDefaultState(): SergeantConversationState {
  return {
    version: SERGEANT_SESSION_VERSION,
    isOpen: false,
    messages: [createSergeantWelcomeMessage()],
    draft: "",
    status: "idle",
    lastContextSnapshot: null,
    hasUnreadSystemHint: false,
    pausedOnboardingContext: null,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSergeantConversationStatus(value: unknown): value is SergeantConversationStatus {
  return value === "idle" || value === "sending" || value === "error";
}

function readPersistedSergeantState(): PersistedSergeantState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SERGEANT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedSergeantState>;
    if (!isObject(parsed)) {
      return null;
    }

    return {
      ...createDefaultState(),
      version:
        typeof parsed.version === "number" ? parsed.version : SERGEANT_SESSION_VERSION,
      isOpen: typeof parsed.isOpen === "boolean" ? parsed.isOpen : false,
      messages: Array.isArray(parsed.messages) ? parsed.messages : createDefaultState().messages,
      draft: typeof parsed.draft === "string" ? parsed.draft : "",
      status: isSergeantConversationStatus(parsed.status) ? parsed.status : "idle",
      lastContextSnapshot: isObject(parsed.lastContextSnapshot)
        ? (parsed.lastContextSnapshot as SergeantContextSnapshot)
        : null,
      hasUnreadSystemHint:
        typeof parsed.hasUnreadSystemHint === "boolean" ? parsed.hasUnreadSystemHint : false,
      pausedOnboardingContext: isObject(parsed.pausedOnboardingContext)
        ? (parsed.pausedOnboardingContext as SergeantPausedOnboardingContext)
        : null,
    };
  } catch {
    return null;
  }
}

export function persistSergeantState(state: SergeantConversationState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SERGEANT_STORAGE_KEY, JSON.stringify(state));
}

export const useSergeantStore = create<SergeantStore>((set) => ({
  ...createDefaultState(),
  hasHydrated: false,
  hydrateFromStorage: () => {
    const defaults = createDefaultState();
    const persisted = readPersistedSergeantState();

    if (!persisted || persisted.version !== SERGEANT_SESSION_VERSION) {
      set({
        ...defaults,
        hasHydrated: true,
      });
      return;
    }

    set({
      ...defaults,
      ...persisted,
      status: "idle",
      hasHydrated: true,
    });
  },
  openAssistant: () => set({ isOpen: true, hasUnreadSystemHint: false }),
  closeAssistant: () => set({ isOpen: false }),
  setDraft: (draft) => set({ draft }),
  setStatus: (status) => set({ status }),
  setLastContextSnapshot: (lastContextSnapshot) => set({ lastContextSnapshot }),
  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      hasUnreadSystemHint:
        !state.isOpen && message.kind === "system" ? true : state.hasUnreadSystemHint,
    })),
  appendSystemMessage: (content) =>
    set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage?.kind === "system" && lastMessage.content === content) {
        return state;
      }

      return {
        messages: [
          ...state.messages,
          {
            ...createSergeantWelcomeMessage(),
            content,
          },
        ],
        hasUnreadSystemHint: !state.isOpen,
      };
    }),
  clearConversation: () =>
    set((state) => ({
      ...createDefaultState(),
      isOpen: state.isOpen,
      hasHydrated: state.hasHydrated,
      pausedOnboardingContext: state.pausedOnboardingContext,
      lastContextSnapshot: state.lastContextSnapshot,
    })),
  setPausedOnboardingContext: (pausedOnboardingContext) => set({ pausedOnboardingContext }),
  setHasUnreadSystemHint: (hasUnreadSystemHint) => set({ hasUnreadSystemHint }),
}));
