import { AdBreak, AdVert } from "./AdBreak";

export interface AnalyticEventObserver {
    onAnalyticUpdate: () => void;
    onAdvertBreakEarlyReturn: (adBreak: AdBreak) => void;
    onAdvertBreakStart: (adBreak: AdBreak) => void;
    onAdvertBreakEnd: () => void;
    onAdvertStart: (advert: AdVert) => void;
    onAdvertEnd: () => void;
    onSessionTimeout: () => void;
    onTrackingEvent: (type: string) => void;
    onTrackingError: (error: any) => void;
}
