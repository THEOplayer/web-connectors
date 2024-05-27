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

export enum PlaybackMode {
    LIVE = 0,
    DVRLIVE = 1,
    VOD = 2
}

export type YospaceSessionCallback = (state: SessionState, result: ResultCode) => void;
export type YospaceSessionManagerCreator = {
    create(url: string, properties: object, successCallback: YospaceSessionCallback): void;
};

export interface YospaceSession {
    getPlaybackMode(): PlaybackMode;

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

export interface YospaceSessionDVRLive extends YospaceSession {
    getPlaybackMode(): PlaybackMode.DVRLIVE;

    getDuration(): number;

    getStreamStart(): number;

    getManifestData<T>(key: string): T | undefined;
    getManifestData(): Map<string, any>;

    getWindowStart(): number;

    getWindowEnd(): number;

    getWindowSize(): number;

    setAdBreaksInactivePriorTo(playhead: number): void;
}

export { YospaceSession as YospaceSessionManager };
