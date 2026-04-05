import type { Message } from "../shared/types";
import { getContexts, setContexts } from "../shared/storage";

const DEFAULT_ICONS = {
    16: "icons/icon_16.png",
    48: "icons/icon_48.png",
    128: "icons/icon_128.png",
} as const;

const MUTED_ICONS = {
    16: "icons/muted_16.png",
    48: "icons/muted_48.png",
    128: "icons/muted_128.png",
} as const;

const createOffscreen = async (): Promise<void> => {
    if (await chrome.offscreen.hasDocument()) return;

    chrome.offscreen.createDocument({
        url: "src/offscreen/offscreen.html",
        reasons: ["USER_MEDIA"],
        justification: "To control tab audio using Web Audio API",
    });
};

const initializeAudio = async (tabId: string): Promise<void> => {
    const contexts = await getContexts(tabId);

    if (contexts.streamId) return;

    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: parseInt(tabId) });
    await setContexts(tabId, { ...contexts, streamId });

    chrome.runtime.sendMessage({ type: "INIT_AUDIO", tabId, streamId } satisfies Message);
};

const updateVolumeBadge = (tabId: string, volume: number, muted: boolean): void => {
    const tabIdNum = parseInt(tabId);
    chrome.action.setBadgeText({ tabId: tabIdNum, text: muted ? "" : volume.toString() });
    chrome.action.setBadgeBackgroundColor({ tabId: tabIdNum, color: "#F5F5F5" });
};

const updateIcon = (tabId: string, muted: boolean): void => {
    chrome.action.setIcon({ tabId: parseInt(tabId), path: muted ? MUTED_ICONS : DEFAULT_ICONS });
};

const updateVolume = async (tabId: string): Promise<void> => {
    await initializeAudio(tabId);

    const { volume, muted } = await getContexts(tabId);
    updateVolumeBadge(tabId, volume, muted);
    updateIcon(tabId, muted);

    chrome.runtime.sendMessage({ type: "SET_VOLUME", tabId, volume, muted } satisfies Message);
};

chrome.runtime.onInstalled.addListener(() => createOffscreen());
chrome.runtime.onStartup.addListener(() => createOffscreen());

chrome.tabs.onCreated.addListener((tab: chrome.tabs.Tab) => {
    chrome.tabs.update(tab.id!, { muted: true });
});

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.OnActivatedInfo) => {
    updateVolume(activeInfo.tabId.toString());
});

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
    if (changeInfo.status === "complete") updateVolume(tabId.toString());
});

chrome.tabs.onRemoved.addListener((tabId: number) => {
    const tabIdStr = tabId.toString();
    chrome.storage.local.remove(tabIdStr);
    chrome.runtime.sendMessage({ type: "DELETE_CONTEXTS", tabId: tabIdStr } satisfies Message);
});

chrome.runtime.onMessage.addListener(async (message: Message) => {
    if (message.type === "UPDATE_VOLUME") await updateVolume(message.tabId);
});
