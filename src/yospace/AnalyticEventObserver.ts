import { AdBreak, AdVert } from "./AdBreak";
import {TrackingError} from "./TrackingError";

export enum SessionErrorCode {
    TIMEOUT
}

export interface AnalyticEventObserver {
    onAnalyticUpdate: () => void;
    onAdvertBreakEarlyReturn: (adBreak: AdBreak) => void;
    onAdvertBreakStart: (adBreak: AdBreak) => void;
    onAdvertBreakEnd: () => void;
    onAdvertStart: (advert: AdVert) => void;
    onAdvertEnd: () => void;
    onSessionError: (error: SessionErrorCode) => void;
    onTrackingEvent: (type: string) => void;
    onTrackingError: (error: TrackingError) => void;
}
