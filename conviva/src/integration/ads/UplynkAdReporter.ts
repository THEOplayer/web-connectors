import type {
    ChromelessPlayer,
    UplynkAdBeginEvent,
    UplynkAdBreak,
    UplynkAdBreakBeginEvent,
    UplynkAddAdBreakEvent,
    UplynkRemoveAdBreakEvent,
    VideoQuality
} from 'theoplayer';
import { type AdAnalytics, Constants, type VideoAnalytics } from '../../utils/ConvivaSdk';
import { calculateUplynkAdBreakInfo, collectPlayerInfo, collectUplynkAdMetadata } from '../../utils/Utils';

export class UplynkAdReporter {
    private readonly player: ChromelessPlayer;
    private readonly convivaVideoAnalytics: VideoAnalytics;
    private readonly convivaAdAnalytics: AdAnalytics;

    private currentAdBreak: UplynkAdBreak | undefined;
    private adBreakCounter: number = 1;

    constructor(player: ChromelessPlayer, videoAnalytics: VideoAnalytics, adAnalytics: AdAnalytics) {
        this.player = player;
        this.convivaVideoAnalytics = videoAnalytics;
        this.convivaAdAnalytics = adAnalytics;
        this.convivaAdAnalytics.setAdPlayerInfo(collectPlayerInfo());
        this.addEventListeners();
    }

    private onAdBreakBegin = (event: UplynkAdBreakBeginEvent) => {
        this.currentAdBreak = event.adBreak;
        this.convivaVideoAnalytics.reportAdBreakStarted(
            Constants.AdType.SERVER_SIDE,
            Constants.AdPlayer.CONTENT,
            calculateUplynkAdBreakInfo(this.currentAdBreak, this.adBreakCounter)
        );
        this.adBreakCounter++;
    };

    private onAdBreakEnd = () => {
        this.convivaVideoAnalytics.reportAdBreakEnded();
        this.currentAdBreak = undefined;
    };

    private onAdBreakSkip = () => {
        this.convivaAdAnalytics.reportAdMetric(Constants.Playback.PLAYER_STATE, Constants.PlayerState.STOPPED);
        this.convivaVideoAnalytics.reportAdBreakEnded();
        this.currentAdBreak = undefined;
    };

    private onAdBegin = (event: UplynkAdBeginEvent) => {
        const adMetadata = collectUplynkAdMetadata(event.ad);
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

    private onAdEnd = () => {
        this.convivaAdAnalytics.reportAdEnded();
    };

    private onAddAdBreak = (event: UplynkAddAdBreakEvent) => {
        const adBreak = event.adBreak;
        adBreak.addEventListener('adbreakbegin', this.onAdBreakBegin);
        adBreak.addEventListener('adbreakend', this.onAdBreakEnd);
        adBreak.addEventListener('adbreakskip', this.onAdBreakSkip);
        for (let i = 0; i < adBreak.ads.length; i++) {
            adBreak.ads[i].addEventListener('adbegin', this.onAdBegin);
            adBreak.ads[i].addEventListener('adend', this.onAdEnd);
        }
    };

    private onRemoveAdBreak = (event: UplynkRemoveAdBreakEvent) => {
        const adBreak = event.adBreak;
        adBreak.removeEventListener('adbreakbegin', this.onAdBreakBegin);
        adBreak.removeEventListener('adbreakend', this.onAdBreakEnd);
        adBreak.removeEventListener('adbreakskip', this.onAdBreakSkip);
        for (let i = 0; i < adBreak.ads.length; i++) {
            adBreak.ads[i].removeEventListener('adbegin', this.onAdBegin);
            adBreak.ads[i].removeEventListener('adend', this.onAdEnd);
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

    private addEventListeners() {
        this.player.uplynk!.ads.adBreaks.addEventListener('addadbreak', this.onAddAdBreak);
        this.player.uplynk!.ads.adBreaks.addEventListener('removeadbreak', this.onRemoveAdBreak);
        this.player.addEventListener('playing', this.onPlaying);
        this.player.addEventListener('pause', this.onPause);
    }

    private removeEventListeners() {
        this.player.uplynk!.ads.adBreaks.removeEventListener('addadbreak', this.onAddAdBreak);
        this.player.uplynk!.ads.adBreaks.removeEventListener('removeadbreak', this.onRemoveAdBreak);
        this.player.removeEventListener('playing', this.onPlaying);
        this.player.removeEventListener('pause', this.onPause);
    }

    destroy() {
        this.removeEventListeners();
    }
}
