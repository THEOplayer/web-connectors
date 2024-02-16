import { PlayerEvent } from './PlayerEvent';
import { TimedMetadata } from './TimedMetadata';
import { AnalyticEventObserver } from './AnalyticEventObserver';

export enum ResultCode {
    CONNECTION_ERROR = -1,
    CONNECTION_TIMEOUT = -2,
    MALFORMED_URL = -3,
    UNKNOWN_FORMAT = -20
}

export enum SessionState {
    NONE,
    INITIALISED,
    FAILED,
    NO_ANALYTICS,
    SHUT_DOWN
}

export type YospaceSessionCallback = (state: SessionState, result: ResultCode) => void;
export type YospaceSessionManagerCreator = {
    create(url: string, properties: object, successCallback: YospaceSessionCallback): void;
};

export interface YospaceSessionManager {
    getPlaybackUrl(): string;

    getResultCode(): number;

    getSessionState(): SessionState;

    onPlayerEvent(event: PlayerEvent, playhead: number): void;

    onPlayheadUpdate(playhead: number): void;

    onVolumeChange(muted: boolean): void;

    onTimedMetadata(metadata: TimedMetadata): void;

    addAnalyticObserver(observer: AnalyticEventObserver): void;

    shutdown(): void;
}
