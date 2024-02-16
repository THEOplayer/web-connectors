import { ChromelessPlayer, VideoQuality } from 'theoplayer';
import { AdAnalytics, Constants, VideoAnalytics } from '@convivainc/conviva-js-coresdk';
import { AdBreak, AdVert, AnalyticEventObserver, YospaceConnector } from '@theoplayer/yospace-connector-web';
import { collectPlayerInfo, collectYospaceAdMetadata } from '../../utils/Utils';

export class YospaceAdReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaAdAnalytics: AdAnalytics;
    private readonly convivaVideoAnalytics: VideoAnalytics;
    private readonly yospaceConnector: YospaceConnector;

    private readonly observer: AnalyticEventObserver;

    private currentAdBreak: AdBreak | undefined;

    constructor(
        player: ChromelessPlayer,
        videoAnalytics: VideoAnalytics,
        adAnalytics: AdAnalytics,
        yospace: YospaceConnector
    ) {
        this.player = player;
        this.convivaVideoAnalytics = videoAnalytics;
        this.convivaAdAnalytics = adAnalytics;
        this.yospaceConnector = yospace;
        this.observer = {
            onAnalyticUpdate: () => {},
            onAdvertBreakEarlyReturn: (_: AdBreak) => {},
            onAdvertBreakStart: this.onYospaceAdBreakStart,
            onAdvertBreakEnd: this.onYospaceAdBreakEnd,
            onAdvertStart: this.onYospaceAdvertStart,
            onAdvertEnd: this.onYospaceAdvertEnd,
            onSessionTimeout: () => {},
            onTrackingEvent: (_: string) => {}
        };
        this.yospaceConnector.addEventListener('sessionavailable', () => {
            console.log('session initialized');
            this.yospaceConnector.registerAnalyticEventObserver(this.observer);
        });
        this.convivaAdAnalytics.setAdPlayerInfo(collectPlayerInfo());
        this.addEventListeners();
    }

    private readonly onYospaceAdBreakStart = (adBreak: AdBreak) => {
        this.currentAdBreak = adBreak;
        this.convivaVideoAnalytics.reportAdBreakStarted(Constants.AdType.SERVER_SIDE, Constants.AdPlayer.CONTENT);
    };

    private readonly onYospaceAdvertStart = (advert: AdVert) => {
        if (this.currentAdBreak === undefined) {
            return;
        }
        const adMetadata = collectYospaceAdMetadata(this.player, advert);
        this.convivaAdAnalytics.setAdInfo(adMetadata);
        this.convivaAdAnalytics.reportAdStarted(adMetadata);
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PLAYING);
        this.convivaAdAnalytics.reportAdMetric(
            Constants.Playback.RESOLUTION,
            this.player.videoWidth,
            this.player.videoHeight
        );
        const activeVideoTrack = this.player.videoTracks[0];
        const activeQuality = activeVideoTrack?.activeQuality;
        if (activeQuality) {
            this.convivaAdAnalytics.reportAdMetric(Constants.Playback.BITRATE, activeQuality.bandwidth / 1000);
            const frameRate = (activeQuality as VideoQuality).frameRate;
            if (frameRate) {
                this.convivaAdAnalytics.reportAdMetric(Constants.Playback.RENDERED_FRAMERATE, frameRate);
            }
        }
    };

    private readonly onPlaying = () => {
        if (this.currentAdBreak) {
            this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PLAYING);
        }
    };

    private readonly onPause = () => {
        if (this.currentAdBreak) {
            this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.PAUSED);
        }
    };

    private readonly onYospaceAdBreakEnd = () => {
        this.convivaVideoAnalytics.reportAdBreakEnded();
        this.currentAdBreak = undefined;
    };

    private readonly onYospaceAdvertEnd = () => {
        this.convivaAdAnalytics.reportAdEnded();
    };

    private addEventListeners(): void {
        this.player.addEventListener('playing', this.onPlaying);
        this.player.addEventListener('pause', this.onPause);
    }

    private removeEventListeners(): void {
        this.player.removeEventListener('playing', this.onPlaying);
        this.player.removeEventListener('pause', this.onPause);
    }

    destroy() {
        this.removeEventListeners();
        this.yospaceConnector.unregisterAnalyticEventObserver(this.observer);
    }
}
