import type { Ad, AdBreak, AdsEventMap, ChromelessPlayer, EventDispatcher, GoogleImaAd } from 'theoplayer';
import { type AdAnalytics, Constants, type ConvivaMetadata, type VideoAnalytics } from '../../utils/ConvivaSdk';
import {
    calculateAdType,
    calculateCurrentAdBreakInfo,
    collectAdMetadata,
    collectPlayerInfo,
    updateAdMetadataForGoogleIma
} from '../../utils/Utils';

declare module 'theoplayer' {
    interface Ads {
        convivaAdEventsExtension?: EventDispatcher<AdsEventMap>;
    }
}

export class AdReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaVideoAnalytics: VideoAnalytics;
    private readonly convivaAdAnalytics: AdAnalytics;
    private readonly contentInfo: () => ConvivaMetadata;

    private currentAdBreak: AdBreak | undefined;
    private currentAd: Ad | undefined;
    private adBreakCounter: number = 1;

    constructor(
        player: ChromelessPlayer,
        videoAnalytics: VideoAnalytics,
        adAnalytics: AdAnalytics,
        contentInfo: () => ConvivaMetadata
    ) {
        this.player = player;
        this.convivaVideoAnalytics = videoAnalytics;
        this.convivaAdAnalytics = adAnalytics;
        this.convivaAdAnalytics.setCallback(this.convivaAdCallback);
        this.convivaAdAnalytics.setAdPlayerInfo(collectPlayerInfo());
        this.contentInfo = contentInfo;
        this.addEventListeners();
    }

    private readonly onAdBreakBegin = (event: any) => {
        this.currentAdBreak = event.adBreak as AdBreak;
        // Conviva assured they expect a string, so we could already pass 'Server Guided' directly.
        this.convivaVideoAnalytics.reportAdBreakStarted(
            calculateAdType(this.currentAdBreak) as any,
            Constants.AdPlayer.CONTENT,
            calculateCurrentAdBreakInfo(this.currentAdBreak, this.adBreakCounter)
        );
        this.adBreakCounter++;
    };

    private readonly onAdBreakEnd = () => {
        this.convivaVideoAnalytics.reportAdBreakEnded();
        this.currentAd = undefined;
        this.currentAdBreak = undefined;
    };

    private readonly onAdBegin = (event: any) => {
        const currentAd = event.ad as Ad;
        this.currentAd = currentAd;
        if (currentAd.type !== 'linear') {
            return;
        }
        const adMetadata = collectAdMetadata(currentAd);
        if (currentAd.integration === 'google-ima') {
            updateAdMetadataForGoogleIma(currentAd as GoogleImaAd, adMetadata);
        }

        // Every session ad or content has its session ID. In order to “attach” an ad to its respective content session,
        // there are two tags that are critical:
        // - `c3.csid`: the content’s sessionID;
        // - `contentAssetName`: the content's assetName.
        // @ts-expect-error: getSessionId() is not present in type declarations.
        adMetadata['c3.csid'] = `${this.convivaVideoAnalytics.getSessionId()}`;
        adMetadata.contentAssetName =
            this.contentInfo()[Constants.ASSET_NAME] ?? this.player.source?.metadata?.title ?? 'NA';

        // [Required] The ad technology as CLIENT_SIDE/SERVER_SIDE
        //  SGAI isn't officially supported by conviva yet, overwrite with our own string for now.
        adMetadata['c3.ad.technology'] = calculateAdType(currentAd);

        this.convivaAdAnalytics.setAdInfo(adMetadata);
        this.convivaAdAnalytics.reportAdLoaded(adMetadata);

        // Report playing state in case of SSAI or SGAI.
        if (
            calculateAdType(currentAd) === Constants.AdType.SERVER_SIDE ||
            calculateAdType(currentAd) === 'Server Guided'
        ) {
            this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PLAYING);
        }
    };

    private readonly onAdEnd = (event: any) => {
        const currentAd = event.ad as Ad;
        if (currentAd.type !== 'linear') {
            return;
        }
        this.currentAd = undefined;
        this.convivaAdAnalytics.reportAdEnded();
    };

    private readonly onAdSkip = () => {
        if (!this.currentAdBreak) {
            return;
        }
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.STOPPED);
    };

    private readonly onAdBuffering = () => {
        if (!this.currentAdBreak) {
            return;
        }
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.BUFFERING);
    };

    private readonly onAdError = (event: any) => {
        this.convivaAdAnalytics.reportAdFailed(event.message || 'Ad Request Failed');
    };

    private readonly onPlaying = () => {
        if (!this.currentAdBreak || !this.currentAd) {
            return;
        }

        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PLAYING);
    };

    // NOTE (nils.thingvall@dolby.com, 27/08/2025): Using onLoadedData based off of Conviva comments
    // stating ad start should happen when the first frame of the ad is displayed, regardless of playing status.
    private readonly onLoadedData = () => {
        if (!this.currentAdBreak || !this.currentAd) {
            return;
        }
        this.startCurrentAd();
    };

    private readonly onPause = () => {
        if (!this.currentAdBreak) {
            return;
        }
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PAUSED);
    };

    private convivaAdCallback = () => {
        const currentTime = this.player.currentTime * 1000;
        this.convivaAdAnalytics!.reportAdMetric(Constants.Playback.PLAY_HEAD_TIME, currentTime);
    };

    private addEventListeners(): void {
        this.player.addEventListener('playing', this.onPlaying);
        this.player.addEventListener('pause', this.onPause);
        this.player.addEventListener('loadeddata', this.onLoadedData);
        [this.player.ads, this.player.ads?.convivaAdEventsExtension].forEach((dispatcher) => {
            dispatcher?.addEventListener('adbreakbegin', this.onAdBreakBegin);
            dispatcher?.addEventListener('adbreakend', this.onAdBreakEnd);
            dispatcher?.addEventListener('adbegin', this.onAdBegin);
            dispatcher?.addEventListener('adend', this.onAdEnd);
            dispatcher?.addEventListener('adskip', this.onAdSkip);
            dispatcher?.addEventListener('adbuffering', this.onAdBuffering);
            dispatcher?.addEventListener('aderror', this.onAdError);
        });
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('playing', this.onPlaying);
        this.player.removeEventListener('pause', this.onPause);
        this.player.removeEventListener('loadeddata', this.onLoadedData);
        [this.player.ads, this.player.ads?.convivaAdEventsExtension].forEach((dispatcher) => {
            dispatcher?.removeEventListener('adbreakbegin', this.onAdBreakBegin);
            dispatcher?.removeEventListener('adbreakend', this.onAdBreakEnd);
            dispatcher?.removeEventListener('adbegin', this.onAdBegin);
            dispatcher?.removeEventListener('adend', this.onAdEnd);
            dispatcher?.removeEventListener('adskip', this.onAdSkip);
            dispatcher?.removeEventListener('adbuffering', this.onAdBuffering);
            dispatcher?.removeEventListener('aderror', this.onAdError);
        });
    }

    private startCurrentAd(): void {
        if (!this.currentAd) {
            return;
        }
        const adMetadata = collectAdMetadata(this.currentAd);
        this.convivaAdAnalytics.reportAdStarted(adMetadata);
        this.convivaAdAnalytics.reportAdMetric(
            Constants.Playback.RESOLUTION,
            this.player.videoWidth,
            this.player.videoHeight
        );
        this.convivaAdAnalytics.reportAdMetric(
            Constants.Playback.BITRATE,
            (this.currentAd as GoogleImaAd).bitrate || 0
        );
    }

    reset(): void {
        this.adBreakCounter = 0;
    }

    destroy(): void {
        if (this.currentAdBreak) {
            this.onAdBreakEnd();
        }
        this.removeEventListeners();
    }
}
