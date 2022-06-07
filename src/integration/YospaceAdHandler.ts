import {AnalyticEventObserver} from "../yospace/AnalyticEventObserver";
import {AdBreak, AdVert} from "../yospace/AdBreak";
import {YospaceSessionManager} from "../yospace/YospaceSessionManager";

export class YospaceAdHandler {

    private sessionManager: YospaceSessionManager;

    constructor(sessionManager: YospaceSessionManager) {
        this.sessionManager = sessionManager;
        this.initialiseAdSession();
    }

    /**
     * Registers a callback object to the session manager which receives new advert events.
     */
    private initialiseAdSession(): void {
        const callbackObject: AnalyticEventObserver = {
            onAdvertBreakEarlyReturn: (adBreak: AdBreak) => {
                // No operation.
            },
            onAdvertBreakStart: (adBreak: AdBreak) => {
                // No operation.
            },
            onAdvertBreakEnd: () => {
                // No operation.
            },
            onAdvertStart: (advert: AdVert) => {
                // No operation.
            },
            onAdvertEnd: () => {
                // Function gets called at the end of each advert within a break.
                // No operation.
            },
            onSessionTimeout: () => {
                // No operation.
            },
            onAnalyticUpdate: () => {
                // No operation.
            },
            onTrackingEvent: (type: string) => {
                // No operation.
            }
        }
        this.sessionManager.addAnalyticObserver(callbackObject);
    }
}
