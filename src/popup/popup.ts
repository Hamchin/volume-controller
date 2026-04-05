import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import type { Message } from "../shared/types";
import { getContexts, setContexts } from "../shared/storage";

const MIN_VOLUME = 0;
const MAX_VOLUME = 200;

const volumeDisplay: HTMLElement = document.getElementById("volumeDisplay")!;
const volumeSlider: HTMLInputElement = document.getElementById("volumeSlider") as HTMLInputElement;
const volumeUp1Button: HTMLButtonElement = document.getElementById("volumeUp1Button") as HTMLButtonElement;
const volumeUp10Button: HTMLButtonElement = document.getElementById("volumeUp10Button") as HTMLButtonElement;
const volumeDown1Button: HTMLButtonElement = document.getElementById("volumeDown1Button") as HTMLButtonElement;
const volumeDown10Button: HTMLButtonElement = document.getElementById("volumeDown10Button") as HTMLButtonElement;
const muteButton: HTMLButtonElement = document.getElementById("muteButton") as HTMLButtonElement;
const muteIcon: HTMLElement = document.getElementById("muteIcon") as HTMLElement;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
const clamp = (volume: number): number => Math.min(MAX_VOLUME, Math.max(MIN_VOLUME, volume));

const getCurrentTabId = async (): Promise<string> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.id!.toString();
};

const updateMuteButton = (muted: boolean): void => {
    muteButton.setAttribute("aria-pressed", muted.toString());
    muteIcon.className = muted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume";
};

const updateVolume = async (tabId: string, volume: number | null, muted: boolean | null): Promise<void> => {
    const contexts = await getContexts(tabId);

    const nextVolume = volume ?? contexts.volume;
    const nextMuted = muted ?? contexts.muted;

    volumeDisplay.textContent = nextVolume.toString();
    volumeSlider.value = nextVolume.toString();
    updateMuteButton(nextMuted);

    await setContexts(tabId, { ...contexts, volume: nextVolume, muted: nextMuted });
    await chrome.runtime.sendMessage({ type: "UPDATE_VOLUME", tabId } satisfies Message);
};

const changeVolume = async (delta: number): Promise<void> => {
    const step = Math.abs(delta);
    const round = delta > 0 ? Math.floor : Math.ceil;
    const currentVolume = parseInt(volumeSlider.value);
    const nextVolume = clamp(round(currentVolume / step) * step + delta);

    if (nextVolume === currentVolume) return;

    const tabId = await getCurrentTabId();
    await updateVolume(tabId, nextVolume, null);
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

volumeUp1Button.addEventListener("click", async (): Promise<void> => {
    await changeVolume(1);
});

volumeUp10Button.addEventListener("click", async (): Promise<void> => {
    await changeVolume(10);
});

volumeDown1Button.addEventListener("click", async (): Promise<void> => {
    await changeVolume(-1);
});

volumeDown10Button.addEventListener("click", async (): Promise<void> => {
    await changeVolume(-10);
});

muteButton.addEventListener("click", async (): Promise<void> => {
    await toggleMuted();
});

window.addEventListener("keydown", async (event: KeyboardEvent): Promise<void> => {
    const isRight = event.key === "ArrowRight";
    const isLeft = event.key === "ArrowLeft";

    if (!isRight && !isLeft) return;

    event.preventDefault();

    const step = event.shiftKey ? 1 : 10;
    const delta = isRight ? step : -step;
    await changeVolume(delta);
});

window.addEventListener("keydown", async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== "m" && event.key !== "M") return;
    event.preventDefault();
    await toggleMuted();
});

restoreVolume();
