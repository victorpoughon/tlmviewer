export const PROTOCOL_VERSION = 1;

export type MessageType = "scene" | "plot" | "log" | "image";

export type Mode = "latest" | "append";

export type Envelope<T = unknown> = {
    v: number;
    type: MessageType;
    topic: string;
    mode: Mode;
    payload: T;
};
