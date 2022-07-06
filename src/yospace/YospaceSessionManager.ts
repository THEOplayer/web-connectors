import { PlayerEvent } from "./PlayerEvent";
import { TimedMetadata } from "./TimedMetadata";
import { AnalyticEventObserver } from "./AnalyticEventObserver";

export enum ResultCode {
    CONNECTION_ERROR = -1,
    CONNECTION_TIMEOUT = -2,
    MALFORMED_URL = -3,
    UNKNOWN_FORMAT = -20
}

export enum SessionResult {
    NOT_INITIALISED,
    INITIALISED,
    FAILED,
    NO_ANALYTICS,
    TIMEOUT
}

export type YospaceSessionCallback = (state: SessionResult, result: ResultCode) => void;
export type YospaceSessionManagerCreator = {
    create(url: string, properties: object, successCallback: YospaceSessionCallback): void;
};

export interface YospaceSessionManager {
    getPlaybackUrl(): string;

    getResultCode(): number;

    getSessionResult(): SessionResult;

    onPlayerEvent(event: PlayerEvent, playhead: number): void;

    onPlayheadUpdate(playhead: number): void;

    onVolumeChange(muted: boolean): void;

    onTimedMetadata(metadata: TimedMetadata): void;

    addAnalyticObserver(observer: AnalyticEventObserver): void;

    shutdown(): void;
}
