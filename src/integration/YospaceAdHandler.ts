import {AnalyticEventObserver} from "../yospace/AnalyticEventObserver";
import {AdBreak, AdVert, ResourceType} from "../yospace/AdBreak";
import {YospaceSessionManager} from "../yospace/YospaceSessionManager";
import {YospaceUiHandler} from "./YospaceUIHandler";
import {YoSpaceLinearAd, YoSpaceNonLinearAd} from "./YospaceAd";

export class YospaceAdHandler {

    private sessionManager: YospaceSessionManager;

    private uiHandler: YospaceUiHandler;

    constructor(sessionManager: YospaceSessionManager, uiHandler: YospaceUiHandler) {
        this.sessionManager = sessionManager;
        this.uiHandler = uiHandler;
        this.initialiseAdSession();
    }

    private onAdvertStart(advert: AdVert) {
        const linearCreative = advert.getLinearCreative();
        if (linearCreative) {
            this.uiHandler.createLinearClickThrough(new YoSpaceLinearAd(linearCreative.getClickThroughUrl()));
        }

        const nonLinearCreatives = advert.getNonLinearCreativesByType(ResourceType.STATIC);
        nonLinearCreatives.forEach((nonLinearCreative) => {
            const nonlinearUrl = nonLinearCreative.getResource(ResourceType.STATIC)
            if (nonlinearUrl) {
                this.uiHandler.createNonLinear(new YoSpaceNonLinearAd(nonLinearCreative.getClickThroughUrl(), nonlinearUrl.getStringData()));
            }
        });
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
                this.onAdvertStart(advert);
            },
            onAdvertEnd: () => {
                // Function gets called at the end of each advert within a break.
                this.uiHandler.removeAllAds();
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

    reset(): void {
        this.uiHandler.reset()
    }
}
