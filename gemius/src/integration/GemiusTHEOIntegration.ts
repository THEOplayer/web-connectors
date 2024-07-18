import {
    Ad,
    AdBreak,
    AdBreakEvent,
    AdEvent,
    AdSkipEvent,
    AddTrackEvent,
    ChromelessPlayer,
    EndedEvent,
    GoogleImaAd,
    MediaTrack,
    PauseEvent,
    PlayEvent,
    PlayingEvent,
    QualityEvent,
    RemoveTrackEvent,
    SeekingEvent,
    SourceChangeEvent,
    VideoQuality,
    VolumeChangeEvent,
    WaitingEvent,
} from 'theoplayer';
import type { GemiusPlayer } from '../gemius/Gemius';
import { GemiusConfiguration } from './GemiusConfiguration';
import { AdType, GemiusProgramParameters } from './GemiusParameters';
import { Logger } from '../utils/Logger';
import { BasicEvent } from './GemiusEvents';

const THEOPLAYER_ID = "THEOplayer"
const DEFAULT_AD_ID = "PLACEHOLDER ID"

export class GemiusTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private debug: boolean;
    private gemiusPlayer: GemiusPlayer;
    private programParameters: GemiusProgramParameters;

    private partCount: number = 1;
    private adCount: number = 1;
    private currentAd: Ad | undefined;

    constructor(player: ChromelessPlayer, configuration: GemiusConfiguration, programParameters: GemiusProgramParameters) {
        this.player = player;
        this.debug = configuration.debug ?? false; 
        this.gemiusPlayer = new window.GemiusPlayer(THEOPLAYER_ID ,configuration.gemiusID, {});
        this.programParameters = programParameters;
        this.addListeners();
    }

    public update(programParameters: GemiusProgramParameters) {
        this.programParameters = programParameters;
    }

    public destroy() {
        this.removeListeners();
        this.gemiusPlayer.dispose();
    }

    private addListeners(): void {
        this.player.addEventListener('sourcechange', this.onSourceChange);
        this.player.addEventListener('playing', this.onFirstPlaying);
        this.player.addEventListener('pause', this.onPause);
        this.player.addEventListener('waiting', this.onWaiting);
        this.player.addEventListener('seeking', this.onSeeking);
        this.player.addEventListener('ended', this.onEnded);
        this.player.addEventListener('volumechange', this.onVolumeChange);
        this.player.videoTracks.addEventListener('addtrack', this.onAddTrack);
        this.player.videoTracks.addEventListener('removetrack', this.onRemoveTrack);
        if (this.player.ads) {
            this.player.ads.addEventListener('adbreakbegin', this.onAdBreakBegin)
            this.player.ads.addEventListener('adbreakend', this.onAdBreakEnd)
            this.player.ads.addEventListener('adbegin', this.onAdBegin)
            this.player.ads.addEventListener('adend', this.onAdEnd)
            this.player.ads.addEventListener('adskip', this.onAdSkip)
        }
    }

    private removeListeners(): void {
        this.player.removeEventListener('sourcechange', this.onSourceChange);
        this.player.removeEventListener('playing', this.onFirstPlaying);
        this.player.removeEventListener('pause', this.onPause);
        this.player.removeEventListener('waiting', this.onWaiting);
        this.player.removeEventListener('seeking', this.onSeeking);
        this.player.removeEventListener('ended', this.onEnded);
        this.player.removeEventListener('volumechange', this.onVolumeChange);
        this.player.videoTracks.removeEventListener('addtrack', this.onAddTrack);
        this.player.videoTracks.removeEventListener('removetrack', this.onRemoveTrack);
        if (this.player.ads) {
            this.player.ads.removeEventListener('adbreakbegin', this.onAdBreakBegin)
            this.player.ads.addEventListener('adbreakend', this.onAdBreakEnd)
            this.player.ads.removeEventListener('adbegin', this.onAdBegin)
            this.player.ads.removeEventListener('adend', this.onAdEnd)
            this.player.ads.removeEventListener('adskip', this.onAdSkip)
        }
    }

    // EVENT HANDLERS
    private onSourceChange = (event: SourceChangeEvent) => {
        Logger.log(event);
        if (!this.programParameters) {
            console.log(`[GEMIUS] No program parameters were provdided`);
            return;
        }
        if (!event.source) {
            // TODO handle some clear source flow
            this.reportBasicEvent(BasicEvent.CLOSE)
            return;
        }
        this.reportBasicEvent(BasicEvent.CLOSE)
        this.partCount = 1;
        this.currentAd = undefined;

        const { programID, customAttributes, ...additionalParameters } = this.programParameters
        this.gemiusPlayer.newProgram(programID, {...additionalParameters, ...customAttributes})
    };

    private onFirstPlaying = (event: PlayingEvent) => {
        Logger.log(event);
        const { programID } = this.programParameters;
        const computedVolume = this.player.muted ? -1 : (this.player.volume * 100)
        if (this.currentAd) {
            const { id, adBreak, duration } = this.currentAd;
            const { timeOffset, ads } = adBreak
            const normalizedTimeOffset = this.normalizeTime(timeOffset)
            this.gemiusPlayer.adEvent(programID, id ?? DEFAULT_AD_ID, normalizedTimeOffset, "play", {
                autoPlay: true,
                adPosition: this.adCount,
                breakSize: ads?.length,
                // resolution: `AxB`, TODO
                volume: computedVolume,
                adDuration: duration
            })
        } else {
            if (this.player.ads?.scheduledAdBreaks.some(adBreak => adBreak.timeOffset === 0)) return;
            const offset = this.player.currentTime < 0.5 ? 0 : this.player.currentTime
            console.log(`play event with partID = ${this.partCount}`)
            this.gemiusPlayer.programEvent(programID, offset, "play", {
                autoPlay: this.player.autoplay,
                partID: this.partCount,
                // resolution: `AxB`; TODO
                volume: computedVolume,
                programDuration: this.programParameters.programDuration
            })
        }
        this.player.removeEventListener('playing',this.onFirstPlaying)
    }

    private onPause = (event: PauseEvent) => {
        Logger.log(event);
        this.reportBasicEvent(BasicEvent.PAUSE)
    }

    private onWaiting = (event: WaitingEvent) => {
        Logger.log(event);
        this.reportBasicEvent(BasicEvent.BUFFER)
    }

    private onSeeking = (event: SeekingEvent) => {
        Logger.log(event);
        this.reportBasicEvent(BasicEvent.SEEK)
    }

    private onEnded = (event: EndedEvent) => {
        Logger.log(event);
        this.reportBasicEvent(BasicEvent.COMPLETE)
    }

    private onVolumeChange = (event: VolumeChangeEvent) => {
        Logger.log(event);
        const { volume }  = event
        const { programID } = this.programParameters
        const computedVolume = this.player.muted ? -1 : (volume * 100)
        if (this.currentAd) {
            const { id, adBreak } = this.currentAd;
            const { timeOffset } = adBreak
            const normalizedTimeOffset = this.normalizeTime(timeOffset)
            this.gemiusPlayer.adEvent(programID, id ?? DEFAULT_AD_ID, normalizedTimeOffset, "chngVol", { volume: computedVolume }); // TODO make SSAI ready
        } else {
            const { currentTime } = this.player
            this.gemiusPlayer.programEvent(programID, currentTime, "chngVol", { volume: computedVolume})
        }
    }

    private onAddTrack = (event: AddTrackEvent) => {
        const videoTrack = event.track as MediaTrack;
        videoTrack.addEventListener('activequalitychanged', this.onActiveQualityChanged)
    }

    private onRemoveTrack = (event: RemoveTrackEvent) => {
        const videoTrack = event.track as MediaTrack;
        videoTrack.removeEventListener('activequalitychanged',this.onActiveQualityChanged)
    }

    private onActiveQualityChanged = (event: QualityEvent<"activequalitychanged">) => {
        Logger.log(event)
        const { quality } = event;
        const videoQuality = quality as VideoQuality
        const { width, height } = videoQuality
        const { programID } = this.programParameters
        const { currentTime } = this.player
        this.gemiusPlayer.programEvent(programID, currentTime, "chngQual", { quality: `${width}x${height}` });

    }

    private onAdBreakBegin = (event: AdBreakEvent<'adbreakbegin'>) => {
        Logger.log(event);
        const { programID } = this.programParameters
        const { adBreak } = event
        const { timeOffset } = adBreak
        const normalizedTimeOffset = this.normalizeTime(timeOffset)
        this.gemiusPlayer.programEvent(programID, normalizedTimeOffset, "break");
        this.player.removeEventListener('playing',this.onFirstPlaying);
        this.player.addEventListener('playing',this.onFirstPlaying);
    }

    private onAdBreakEnd = (event: AdBreakEvent<'adbreakend'>) => {
        Logger.log(event);
        this.adCount = 1;
        const { adBreak } = event;
        if (!this.isPreRoll(adBreak) )this.partCount++
        console.log(` partCount = ${this.partCount}`)
        this.player.removeEventListener('playing',this.onFirstPlaying);
        this.player.addEventListener('playing',this.onFirstPlaying);
    }

    private onAdBegin = (event: AdEvent<'adbegin'>) => {
        Logger.log(event);
        const { ad } = event;
        this.currentAd = ad
        const { id, duration, width, height } = ad
        const { clientWidth, clientHeight } = this.player.element;
        this.gemiusPlayer.newAd(id ?? DEFAULT_AD_ID, {
            adName: ad.integration?.includes("google") ? (ad as GoogleImaAd).title ?? "" : "",
            adDuration: duration,
            adType: AdType.BREAK,
            // TODO campaignClassification
            adFormat: 1,
            quality: `${width}x${height}`,
            resolution: `${clientWidth}x${clientHeight}`,
            volume: this.player.muted ? -1 : (this.player.volume * 100)
        })
    }


    private onAdEnd = (event: AdEvent<'adend'>) => {
        Logger.log(event);
        const { programID } = this.programParameters
        const { ad } = event
        const { adBreak } = ad;
        const { timeOffset} = adBreak
        const normalizedTimeOffset = this.normalizeTime(timeOffset)
        this.gemiusPlayer.programEvent(programID, normalizedTimeOffset, BasicEvent.COMPLETE);
        this.adCount++
        this.currentAd = undefined;
        this.player.removeEventListener('playing',this.onFirstPlaying);
        this.player.addEventListener('playing',this.onFirstPlaying);
    }

    private onAdSkip = (event: AdSkipEvent) => {
        Logger.log(event);
        const { programID } = this.programParameters
        const { ad } = event
        const { adBreak } = ad
        const { timeOffset} = adBreak
        const normalizedTimeOffset = this.normalizeTime(timeOffset)
        this.gemiusPlayer.programEvent(programID, normalizedTimeOffset, BasicEvent.SKIP);
    }


    private reportBasicEvent = (event: BasicEvent) => {
        const { programID } = this.programParameters;
        const { currentTime } = this.player;
        if (this.currentAd) {
            const { id, adBreak } = this.currentAd;
            const { timeOffset } = adBreak
            const normalizedTimeOffset = this.normalizeTime(timeOffset)
            this.gemiusPlayer.adEvent(programID, id ?? DEFAULT_AD_ID, normalizedTimeOffset, event); // TODO make SSAI ready
        } else {
            this.gemiusPlayer.programEvent(programID,currentTime, event)
        }
    }

    private normalizeTime = (time: number) => {
        return this.player.ads?.dai?.contentTimeForStreamTime(time) ?? time;
    }

    private isPreRoll = (adBreak: AdBreak) => {
        return adBreak.timeOffset === 0
    }

}
