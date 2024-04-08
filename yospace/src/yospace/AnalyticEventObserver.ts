import { AdBreak, AdVert } from './AdBreak';
import { TrackingError } from './TrackingError';
import { YospaceSessionManager } from './YospaceSessionManager';

// Keep this in sync with YospaceSessionErrorCode from conviva-connector-web
export enum SessionErrorCode {
    TIMEOUT = 0
}

export interface AnalyticEventObserver {
    onAnalyticUpdate: (session: YospaceSessionManager) => void;
    onAdvertBreakEarlyReturn: (adBreak: AdBreak, session: YospaceSessionManager) => void;
    onAdvertBreakStart: (adBreak: AdBreak, session: YospaceSessionManager) => void;
    onAdvertBreakEnd: (session: YospaceSessionManager) => void;
    onAdvertStart: (advert: AdVert, session: YospaceSessionManager) => void;
    onAdvertEnd: (session: YospaceSessionManager) => void;
    onSessionError: (error: SessionErrorCode, session: YospaceSessionManager) => void;
    onTrackingEvent: (type: string, session: YospaceSessionManager) => void;
    onTrackingError: (error: TrackingError, session: YospaceSessionManager) => void;
}
