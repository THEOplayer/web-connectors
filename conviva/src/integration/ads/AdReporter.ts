import type { Ad, AdBreak, ChromelessPlayer, GoogleImaAd } from 'theoplayer';
import { type AdAnalytics, Constants, type ConvivaMetadata, type VideoAnalytics } from '@convivainc/conviva-js-coresdk';
import {
    calculateAdType,
    calculateCurrentAdBreakInfo,
    collectAdMetadata,
    collectPlayerInfo,
    updateAdMetadataForGoogleIma
} from '../../utils/Utils';

export class AdReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaVideoAnalytics: VideoAnalytics;
    private readonly convivaAdAnalytics: AdAnalytics;
    private readonly contentInfo: () => ConvivaMetadata;

    private currentAdBreak: AdBreak | undefined;
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
        this.currentAdBreak = event.ad as AdBreak;
        this.convivaVideoAnalytics.reportAdBreakStarted(
            calculateAdType(this.player),
            Constants.AdPlayer.CONTENT,
            calculateCurrentAdBreakInfo(this.currentAdBreak, this.adBreakCounter)
        );
        this.adBreakCounter++;
    };

    private readonly onAdBreakEnd = () => {
        this.convivaVideoAnalytics.reportAdBreakEnded();
        this.currentAdBreak = undefined;
    };

    private readonly onAdBegin = (event: any) => {
        const currentAd = event.ad as Ad;
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
        adMetadata['c3.ad.technology'] = calculateAdType(this.player);

        this.convivaAdAnalytics.setAdInfo(adMetadata);
        this.convivaAdAnalytics.reportAdLoaded(adMetadata);
        this.convivaAdAnalytics.reportAdStarted(adMetadata);
        this.convivaAdAnalytics.reportAdMetric(
            Constants.Playback.RESOLUTION,
            this.player.videoWidth,
            this.player.videoHeight
        );
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.BITRATE, (currentAd as GoogleImaAd).bitrate || 0);

        // Report playing state in case of SSAI.
        if (calculateAdType(this.player) === Constants.AdType.SERVER_SIDE) {
            this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PLAYING);
        }
    };

    private readonly onAdEnd = (event: any) => {
        const currentAd = event.ad as Ad;
        if (currentAd.type !== 'linear') {
            return;
        }
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
        if (!this.currentAdBreak) {
            return;
        }
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PLAYING);
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
