export interface TabContexts {
    streamId: string | null;
    volume: number;
    muted: boolean;
}

export interface UpdateVolumeMessage {
    type: "UPDATE_VOLUME";
    tabId: string;
}

export interface InitAudioMessage {
    type: "INIT_AUDIO";
    tabId: string;
    streamId: string;
}

export interface SetVolumeMessage {
    type: "SET_VOLUME";
    tabId: string;
    volume: number;
    muted: boolean;
}

export interface DeleteContextsMessage {
    type: "DELETE_CONTEXTS";
    tabId: string;
}

export type Message =
    | UpdateVolumeMessage
    | InitAudioMessage
    | SetVolumeMessage
    | DeleteContextsMessage;
