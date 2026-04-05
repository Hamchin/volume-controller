export {};

const contextsByTabId: { [key: string]: { audioContext: AudioContext; gainNode: GainNode } } = {};

const initializeAudio = async (tabId: string, streamId: string): Promise<void> => {
    const constraints: any = { audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0;

    contextsByTabId[tabId] = { audioContext, gainNode };
}

const setVolume = (tabId: string, volume: number, muted: boolean): void => {
    if (!contextsByTabId.hasOwnProperty(tabId)) {
        return;
    }
    const contexts = contextsByTabId[tabId];
    contexts.gainNode.gain.value = muted ? 0 : volume / 100;
}

chrome.runtime.onMessage.addListener(async (message: any): Promise<void> => {
    if (message.type === "INIT_AUDIO") {
        await initializeAudio(message.tabId, message.streamId);
    }
    if (message.type === "SET_VOLUME") {
        setVolume(message.tabId, message.volume, message.muted);
    }
    if (message.type === "DELETE_CONTEXTS") {
        delete contextsByTabId[message.tabId];
    }
});
