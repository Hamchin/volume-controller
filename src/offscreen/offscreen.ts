import type { Message, MessageResponse } from "../shared/types";

interface AudioContexts {
    audioContext: AudioContext;
    gainNode: GainNode;
    stream: MediaStream;
}

const contextsByTabId = new Map<string, AudioContexts>();
const initPromisesByTabId = new Map<string, Promise<void>>();

const deleteContexts = async (tabId: string): Promise<void> => {
    const contexts = contextsByTabId.get(tabId);
    if (!contexts) return;

    contextsByTabId.delete(tabId);
    contexts.stream.getTracks().forEach((track) => track.stop());
    await contexts.audioContext.close();
};

const initializeAudio = async (tabId: string, streamId: string): Promise<void> => {
    await deleteContexts(tabId);

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

    contextsByTabId.set(tabId, { audioContext, gainNode, stream });
};

const setVolume = (tabId: string, volume: number, muted: boolean): boolean => {
    const contexts = contextsByTabId.get(tabId);
    if (!contexts) return false;
    contexts.gainNode.gain.value = muted ? 0 : volume / 100;
    return true;
};

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse: (response: MessageResponse) => void): boolean | undefined => {
    if (message.type === "INIT_AUDIO") {
        const init = initializeAudio(message.tabId, message.streamId);
        initPromisesByTabId.set(message.tabId, init);
        init.then(
            () => sendResponse({ ok: true }),
            () => sendResponse({ ok: false })
        );
        return true;
    }

    if (message.type === "SET_VOLUME") {
        (async (): Promise<void> => {
            const init = initPromisesByTabId.get(message.tabId);
            if (init) {
                try {
                    await init;
                } catch {}
            }
            sendResponse({ ok: setVolume(message.tabId, message.volume, message.muted) });
        })();
        return true;
    }

    if (message.type === "DELETE_CONTEXTS") {
        initPromisesByTabId.delete(message.tabId);
        void deleteContexts(message.tabId);
    }

    return undefined;
});
