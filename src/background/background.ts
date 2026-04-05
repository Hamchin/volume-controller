export { };

const getContexts = async (tabId: string): Promise<{ [key: string]: any }> => {
    const contextsByTabId = await chrome.storage.local.get(tabId) as { [key: string]: { [key: string]: any } };
    return contextsByTabId[tabId] ?? { streamId: null, volume: 0, muted: false };
};

const createOffscreen = async (): Promise<void> => {
    const hasOffscreen = await chrome.offscreen.hasDocument();

    if (hasOffscreen) {
        return;
    }

    chrome.offscreen.createDocument({
        url: "src/offscreen/offscreen.html",
        reasons: ["USER_MEDIA"],
        justification: "To control tab audio using Web Audio API",
    });
};

const initializeAudio = async (tabId: string): Promise<void> => {
    const contexts = await getContexts(tabId);

    if (contexts.streamId) {
        return;
    }

    const streamId: string = await chrome.tabCapture.getMediaStreamId({ targetTabId: parseInt(tabId) });
    contexts.streamId = streamId;
    await chrome.storage.local.set({ [tabId]: contexts });

    chrome.runtime.sendMessage({ type: "INIT_AUDIO", tabId, streamId });
};

const updateVolumeBadge = (tabId: string, volume: number, muted: boolean): void => {
    chrome.action.setBadgeText({ tabId: parseInt(tabId), text: muted ? "" : volume.toString() });
    chrome.action.setBadgeBackgroundColor({ tabId: parseInt(tabId), color: "#F5F5F5" });
};

const updateIcon = (tabId: string, muted: boolean): void => {
    const defaultIcons = {
        16: "icons/icon_16.png",
        48: "icons/icon_48.png",
        128: "icons/icon_128.png",
    };
    const mutedIcons = {
        16: "icons/muted_16.png",
        48: "icons/muted_48.png",
        128: "icons/muted_128.png",
    };
    chrome.action.setIcon({ tabId: parseInt(tabId), path: muted ? mutedIcons : defaultIcons });
};

const updateVolume = async (tabId: string): Promise<void> => {
    await initializeAudio(tabId);

    const contexts = await getContexts(tabId);
    const volume: number = contexts.volume;
    const muted: boolean = contexts.muted;

    updateVolumeBadge(tabId, volume, muted);
    updateIcon(tabId, muted);

    await chrome.runtime.sendMessage({ type: "SET_VOLUME", tabId, volume, muted });
};

chrome.runtime.onInstalled.addListener((): void => {
    createOffscreen();
});

chrome.runtime.onStartup.addListener((): void => {
    createOffscreen();
});

chrome.tabs.onCreated.addListener((tab: chrome.tabs.Tab): void => {
    chrome.tabs.update(tab.id!, { muted: true });
});

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.OnActivatedInfo): void => {
    updateVolume(activeInfo.tabId.toString());
});

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo): void => {
    if (changeInfo.status === "complete") {
        updateVolume(tabId.toString());
    }
});

chrome.tabs.onRemoved.addListener((tabId: number): void => {
    chrome.storage.local.remove(tabId.toString());
    chrome.runtime.sendMessage({ type: "DELETE_CONTEXTS", tabId: tabId.toString() });
});

chrome.runtime.onMessage.addListener(async (message: any): Promise<void> => {
    if (message.type === "UPDATE_VOLUME") {
        await updateVolume(message.tabId);
    }
});
