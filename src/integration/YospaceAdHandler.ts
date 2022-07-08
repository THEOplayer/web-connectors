import { ChromelessPlayer } from "theoplayer";
import { AnalyticEventObserver } from "../yospace/AnalyticEventObserver";
import { AdBreak, AdVert, ResourceType } from "../yospace/AdBreak";
import { YospaceUiHandler } from "./YospaceUIHandler";
import { YoSpaceLinearAd, YoSpaceNonLinearAd } from "./YospaceAd";
import { YospaceManager } from "./YospaceManager";

export class YospaceAdHandler {
    private yospaceManager: YospaceManager;

    private uiHandler: YospaceUiHandler;

    private player: ChromelessPlayer;

    private advertStartListener: (() => void | undefined) | undefined;

    constructor(yospaceManager: YospaceManager, uiHandler: YospaceUiHandler, player: ChromelessPlayer) {
        this.yospaceManager = yospaceManager;
        this.uiHandler = uiHandler;
        this.player = player;
        this.initialiseAdSession();
    }

    private onAdvertStart(advert: AdVert) {
        if (this.advertStartListener) {
            this.player.removeEventListener("play", this.advertStartListener);
            this.advertStartListener = undefined;
        }

        const linearCreative = advert.getLinearCreative();
        if (linearCreative) {
            this.uiHandler.createLinearClickThrough(new YoSpaceLinearAd(linearCreative.getClickThroughUrl()));
        }

        const nonLinearCreatives = advert.getNonLinearCreativesByType(ResourceType.STATIC);
        nonLinearCreatives.forEach((nonLinearCreative) => {
            const nonlinearUrl = nonLinearCreative.getResource(ResourceType.STATIC);
            if (nonlinearUrl) {
                this.uiHandler.createNonLinear(
                    new YoSpaceNonLinearAd(nonLinearCreative.getClickThroughUrl(), nonlinearUrl.getStringData())
                );
            }
        });
    }

    /**
     * Registers a callback object to the session manager which receives new advert events.
     */
    private initialiseAdSession(): void {
        const callbackObject: AnalyticEventObserver = {
            onAdvertBreakEarlyReturn: (_adBreak: AdBreak) => {
                // No operation.
            },
            onAdvertBreakStart: (_adBreak: AdBreak) => {
                // No operation.
            },
            onAdvertBreakEnd: () => {
                // No operation.
            },
            onAdvertStart: (advert: AdVert) => {
                if (this.yospaceManager.startedPlaying) {
                    this.onAdvertStart(advert);
                } else {
                    this.advertStartListener = () => {
                        this.onAdvertStart(advert);
                    };
                    this.player.addEventListener("play", this.advertStartListener);
                }
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
            onTrackingEvent: (_type: string) => {
                // No operation.
            }
        };
        this.yospaceManager.sessionManager?.addAnalyticObserver(callbackObject);
    }

    reset(): void {
        this.uiHandler.reset();
    }
}
