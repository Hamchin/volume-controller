import type { TabContexts } from "./types";

const DEFAULT_CONTEXTS: TabContexts = { streamId: null, volume: 0, muted: false };

export const getContexts = async (tabId: string): Promise<TabContexts> => {
    const result = await chrome.storage.local.get(tabId) as { [key: string]: TabContexts };
    return result[tabId] ?? { ...DEFAULT_CONTEXTS };
};

export const setContexts = async (tabId: string, contexts: TabContexts): Promise<void> => {
    await chrome.storage.local.set({ [tabId]: contexts });
};
