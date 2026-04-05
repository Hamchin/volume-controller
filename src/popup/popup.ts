export {};

const MIN_VOLUME = 0;
const MAX_VOLUME = 200;

const volumeDisplay: HTMLElement = document.getElementById("volumeDisplay")!;
const volumeSlider: HTMLInputElement = document.getElementById("volumeSlider") as HTMLInputElement;
const muteButton: HTMLButtonElement = document.getElementById("muteButton") as HTMLButtonElement;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const getCurrentTabId = async (): Promise<string> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.id!.toString();
};

const getContexts = async (tabId: string): Promise<{ [key: string]: any }> => {
    const contextsByTabId = await chrome.storage.local.get(tabId) as { [key: string]: { [key: string]: any } };
    return contextsByTabId[tabId] ?? { streamId: null, volume: 0, muted: false };
};

const updateMuteButton = (muted: boolean): void => {
    muteButton.textContent = muted ? "Unmute" : "Mute";
    muteButton.setAttribute("aria-pressed", muted.toString());
};

const updateVolume = async (tabId: string, volume: number | null, muted: boolean | null): Promise<void> => {
    const contexts = await getContexts(tabId);

    volume = (volume ?? contexts.volume) as number;
    contexts.volume = volume;

    muted = (muted ?? contexts.muted) as boolean;
    contexts.muted = muted;

    volumeDisplay.textContent = volume.toString();
    volumeSlider.value = volume.toString();
    updateMuteButton(muted);

    await chrome.storage.local.set({ [tabId]: contexts });
    await chrome.runtime.sendMessage({ type: "UPDATE_VOLUME", tabId });
};

const toggleMuted = async (): Promise<void> => {
    const tabId = await getCurrentTabId();
    const contexts = await getContexts(tabId);
    const muted = !contexts.muted;
    await updateVolume(tabId, null, muted);
};

const restoreVolume = async (): Promise<void> => {
    const tabId = await getCurrentTabId();
    await updateVolume(tabId, null, null);
    await sleep(100);
    await chrome.tabs.update(parseInt(tabId), { muted: false });
};

volumeSlider.addEventListener("input", async (): Promise<void> => {
    const tabId = await getCurrentTabId();
    const volume = parseInt(volumeSlider.value);
    await updateVolume(tabId, volume, null);
});

muteButton.addEventListener("click", async (): Promise<void> => {
    await toggleMuted();
});

window.addEventListener("keydown", async (event: KeyboardEvent): Promise<void> => {
    const isRight = event.key === "ArrowRight";
    const isLeft = event.key === "ArrowLeft";

    if (!isRight && !isLeft) {
        return;
    }

    event.preventDefault();

    const currentVolume = parseInt(volumeSlider.value);

    const step = event.shiftKey ? 1 : 10;
    const delta = isRight ? step : -step;
    const round = isRight ? Math.floor : Math.ceil;
    const clamp = (volume: number): number => Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, volume));
    const nextVolume = clamp(round(currentVolume / step) * step + delta);

    if (nextVolume === currentVolume) {
        return;
    }

    const tabId = await getCurrentTabId();
    await updateVolume(tabId, nextVolume, null);
});

window.addEventListener("keydown", async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "m" && event.key !== "M") {
        return;
    }

    event.preventDefault();
    await toggleMuted();
});

restoreVolume();
