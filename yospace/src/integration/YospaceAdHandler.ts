import type { Ad, AdBreak, AdBreakInit, AdInit, AdIntegrationController, ChromelessPlayer } from 'theoplayer';
import { AnalyticEventObserver, SessionErrorCode } from '../yospace/AnalyticEventObserver';
import { AdBreak as YospaceAdBreak, Advert as YospaceAdvert, ResourceType } from '../yospace/AdBreak';
import { YospaceUiHandler } from './YospaceUIHandler';
import { YoSpaceLinearAd, YoSpaceNonLinearAd } from './YospaceAd';
import { YospaceManager } from './YospaceManager';
import { arrayRemove } from '../utils/DefaultEventDispatcher';
import { TrackingError } from '../yospace/TrackingError';
import { YospaceSessionManager } from '../yospace/YospaceSessionManager';
import { YospaceWindow } from '../yospace/YospaceWindow';

export class YospaceAdHandler {
    private readonly yospaceManager: YospaceManager;
    private readonly uiHandler: YospaceUiHandler;
    private readonly player: ChromelessPlayer;
    private readonly adIntegrationController: AdIntegrationController;
    private advertStartListener: (() => void) | undefined;
    private analyticEventObservers: AnalyticEventObserver[] = [];
    private ads: WeakMap<YospaceAdvert, Ad> = new WeakMap<YospaceAdvert, Ad>();
    private adBreaks: WeakMap<YospaceAdBreak, AdBreak> = new WeakMap<YospaceAdBreak, AdBreak>();
    private currentAdBreak: AdBreak | undefined;
    private currentAd: Ad | undefined;

    constructor(
        yospaceManager: YospaceManager,
        uiHandler: YospaceUiHandler,
        player: ChromelessPlayer,
        adIntegrationController: AdIntegrationController
    ) {
        this.yospaceManager = yospaceManager;
        this.uiHandler = uiHandler;
        this.player = player;
        this.adIntegrationController = adIntegrationController;
        this.initialiseAdSession();
    }

    registerAnalyticEventObserver(analyticsEventObserver: AnalyticEventObserver) {
        this.analyticEventObservers.push(analyticsEventObserver);
    }

    unregisterAnalyticEventObserver(analyticsEventObserver: AnalyticEventObserver) {
        arrayRemove(this.analyticEventObservers, analyticsEventObserver);
    }

    private getOrCreateAdBreak(yospaceAdBreak: YospaceAdBreak, update: boolean): AdBreak {
        let adBreak = this.adBreaks.get(yospaceAdBreak);
        const isNew = adBreak === undefined;
        if (adBreak === undefined) {
            adBreak = this.adIntegrationController.createAdBreak(this.getAdBreakInit(yospaceAdBreak));
            this.adBreaks.set(yospaceAdBreak, adBreak);
        } else if (update) {
            this.adIntegrationController.updateAdBreak(adBreak, this.getAdBreakInit(yospaceAdBreak));
        }
        if (isNew || update) {
            for (const yospaceAdvert of yospaceAdBreak.getAdverts()) {
                this.getOrCreateAd(yospaceAdvert, adBreak, true);
            }
        }
        return adBreak;
    }

    private getAdBreakInit(yospaceAdBreak: YospaceAdBreak): AdBreakInit {
        return {
            timeOffset: yospaceAdBreak.getStart() / 1000,
            maxDuration: yospaceAdBreak.getDuration() / 1000
        };
    }

    private getOrCreateAd(advert: YospaceAdvert, adBreak: AdBreak, update: boolean): Ad {
        let ad = this.ads.get(advert);
        if (ad === undefined) {
            ad = this.adIntegrationController.createAd(this.getAdInit(advert), adBreak);
            this.ads.set(advert, ad);
        } else if (update) {
            this.adIntegrationController.updateAd(ad, this.getAdInit(advert));
        }
        return ad;
    }

    private getAdInit(advert: YospaceAdvert): AdInit {
        const yospace = (window as unknown as YospaceWindow).YospaceAdManagement;
        const creative = advert.isNonLinear()
            ? advert.getNonLinearCreativesByType(yospace.ResourceType.STATIC)?.[0]
            : advert.getLinearCreative();
        return {
            id: advert.getIdentifier(),
            timeOffset: advert.getStart() / 1000,
            type: advert.isNonLinear() ? 'nonlinear' : 'linear',
            duration: advert.getDuration() / 1000,
            clickThrough: creative?.getClickThroughUrl(),
            companions: undefined, // TODO
            skipOffset: advert.getSkipOffset() / 1000,
            creativeId: creative?.getCreativeIdentifier(),
            universalAdIds: undefined // TODO: creative?.getUniversalAdIds()
        };
    }

    private onAdvertBreakStart(yospaceAdBreak: YospaceAdBreak) {
        this.currentAdBreak = this.getOrCreateAdBreak(yospaceAdBreak, true);
    }

    private onAdvertBreakEarlyReturn(_yospaceAdBreak: YospaceAdBreak) {
        if (this.currentAd !== undefined) {
            this.adIntegrationController.skipAd(this.currentAd);
            this.currentAd = undefined;
        }
        this.onAdvertBreakEnd();
    }

    private onAdvertBreakEnd(): void {
        if (this.currentAdBreak !== undefined) {
            this.adIntegrationController.removeAdBreak(this.currentAdBreak);
            this.currentAdBreak = undefined;
        }
    }

    private onAdvertStart(advert: YospaceAdvert) {
        if (this.advertStartListener) {
            this.player.removeEventListener('play', this.advertStartListener);
            this.advertStartListener = undefined;
        }

        const ad = this.ads.get(advert);
        if (ad !== undefined) {
            this.currentAd = ad;
            this.adIntegrationController.beginAd(ad);
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

    private onAdvertEnd(): void {
        if (this.currentAd !== undefined) {
            this.adIntegrationController.endAd(this.currentAd);
            this.currentAd = undefined;
        }
        this.uiHandler.removeAllAds();
    }

    /**
     * Registers a callback object to the session manager which receives new advert events.
     */
    private initialiseAdSession(): void {
        const callbackObject: AnalyticEventObserver = {
            onAdvertBreakEarlyReturn: (adBreak: YospaceAdBreak, session: YospaceSessionManager) => {
                this.onAdvertBreakEarlyReturn(adBreak);
                this.analyticEventObservers.forEach((observer: AnalyticEventObserver) =>
                    observer.onAdvertBreakEarlyReturn?.(adBreak, session)
                );
            },
            onAdvertBreakStart: (adBreak: YospaceAdBreak, session: YospaceSessionManager) => {
                this.onAdvertBreakStart(adBreak);
                this.analyticEventObservers.forEach((observer: AnalyticEventObserver) =>
                    observer.onAdvertBreakStart?.(adBreak, session)
                );
            },
            onAdvertBreakEnd: (session: YospaceSessionManager) => {
                this.onAdvertBreakEnd();
                this.analyticEventObservers.forEach((observer) => observer.onAdvertBreakEnd?.(session));
            },
            onAdvertStart: (advert: YospaceAdvert, session: YospaceSessionManager) => {
                if (this.yospaceManager.startedPlaying) {
                    this.onAdvertStart(advert);
                } else {
                    this.advertStartListener = () => {
                        this.onAdvertStart(advert);
                    };
                    this.player.addEventListener('play', this.advertStartListener);
                }
                this.analyticEventObservers.forEach((observer) => observer.onAdvertStart?.(advert, session));
            },
            onAdvertEnd: (session: YospaceSessionManager) => {
                // Function gets called at the end of each advert within a break.
                this.onAdvertEnd();
                this.analyticEventObservers.forEach((observer) => observer.onAdvertEnd?.(session));
            },
            onSessionError: (error: SessionErrorCode, session: YospaceSessionManager) => {
                this.analyticEventObservers.forEach((observer) => observer.onSessionError?.(error, session));
            },
            onAnalyticUpdate: (session: YospaceSessionManager) => {
                this.analyticEventObservers.forEach((observer) => observer.onAnalyticUpdate?.(session));
            },
            onTrackingEvent: (type: string, session: YospaceSessionManager) => {
                this.analyticEventObservers.forEach((observer) => observer.onTrackingEvent?.(type, session));
            },
            onTrackingError: (error: TrackingError, session: YospaceSessionManager) => {
                this.analyticEventObservers.forEach((observer) => observer.onTrackingError?.(error, session));
            }
        };
        this.yospaceManager.sessionManager?.addAnalyticObserver(callbackObject);
    }

    reset(): void {
        this.analyticEventObservers = [];
        this.uiHandler.reset();
    }
}
