import type { Message } from "../shared/types";

interface AudioContexts {
    audioContext: AudioContext;
    gainNode: GainNode;
}

const contextsByTabId = new Map<string, AudioContexts>();

const initializeAudio = async (tabId: string, streamId: string): Promise<void> => {
    const constraints = {
        audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints as MediaStreamConstraints);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0;

    contextsByTabId.set(tabId, { audioContext, gainNode });
};

const setVolume = (tabId: string, volume: number, muted: boolean): void => {
    const contexts = contextsByTabId.get(tabId);
    if (!contexts) return;
    contexts.gainNode.gain.value = muted ? 0 : volume / 100;
};

chrome.runtime.onMessage.addListener(async (message: Message): Promise<void> => {
    if (message.type === "INIT_AUDIO") await initializeAudio(message.tabId, message.streamId);
    if (message.type === "SET_VOLUME") setVolume(message.tabId, message.volume, message.muted);
    if (message.type === "DELETE_CONTEXTS") contextsByTabId.delete(message.tabId);
});
