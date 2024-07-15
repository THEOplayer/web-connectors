import {
    Ad,
    AdBreakEvent,
    AdEvent,
    ChromelessPlayer,
    DurationChangeEvent,
    EndedEvent,
    Event,
    GoogleImaAd,
    PlayEvent,
    RateChangeEvent,
    SourceChangeEvent,
    TimeUpdateEvent,
    VolumeChangeEvent,
} from 'theoplayer';
import { AdScriptConfiguration } from './AdScriptConfiguration';
import { EmbeddedContentMetadata, EmbeddedContentType, MainVideoContentMetadata, PlayerState } from './../adscript/AdScript' 
import { Logger } from '../utils/Logger';

interface LogPoint {
    offset: number;
    name: string;
    reported: boolean
}

export class AdScriptTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private debug: boolean;
    private adProcessor: ((ad: Ad) => EmbeddedContentMetadata) | undefined;
    private mainContentMetadata: MainVideoContentMetadata;
    private mainContentLogPoints: LogPoint[] = [];
    private mainContentDuration: number | undefined;
    private currentAdMetadata: EmbeddedContentMetadata | undefined;
    private currentAdLogPoints: LogPoint[] = []

    private latestReportedEvent: string | undefined;

    private JHMTApi = window.JHMTApi;
    private JHMT = window.JHMT;

    constructor(player: ChromelessPlayer, configuration: AdScriptConfiguration, metadata: MainVideoContentMetadata) {
        this.player = player;
        this.debug = configuration.debug ?? false; 
        this.adProcessor = configuration?.adProcessor;
        this.mainContentMetadata = metadata;
        Logger.logSetContentMetadata(this.mainContentMetadata)
        this.JHMTApi.setContentMetadata(this.mainContentMetadata)
        this.reportPlayerState();
        this.addListeners();
    }

    public updateMetadata(metadata: MainVideoContentMetadata) {
        this.mainContentMetadata = metadata
        Logger.logSetContentMetadata(this.mainContentMetadata)
        this.JHMTApi.setContentMetadata(this.mainContentMetadata)
    }

    public destroy() {
        this.removeListeners();
    }

    private addListeners(): void {
        this.player.addEventListener('durationchange', this.onDurationChange);
        this.player.addEventListener('sourcechange', this.onSourceChange);
        this.player.addEventListener('timeupdate', this.onTimeUpdate); 
        this.player.addEventListener('play', this.onPlay); // TODO
        this.player.addEventListener('ended', this.onEnded); // TODO
        this.player.addEventListener('volumechange', this.onVolumeChange);
        this.player.addEventListener('ratechange', this.onRateChange);
        this.player.addEventListener('presentationmodechange', this.onPresentationModeChange);
        window.addEventListener("resize", this.reportPlayerState);
        window.addEventListener("blur", this.reportPlayerState);
        window.addEventListener("focus", this.reportPlayerState);
        document.addEventListener("scroll", this.reportPlayerState);
        document.addEventListener("visibilitychange", this.reportPlayerState);
        if (this.player.ads) {
            this.player.ads.addEventListener('adbreakend', this.onAdBreakEnd); //TODO
            this.player.ads.addEventListener('adbegin', this.onAdBegin); //TODO
            this.player.ads.addEventListener("adfirstquartile", this.onAdFirstQuartile);
            this.player.ads.addEventListener("admidpoint", this.onAdMidpoint);
            this.player.ads.addEventListener("adthirdquartile", this.onAdTirdQuartile);
            this.player.ads.addEventListener("adend", this.onAdEnd);
        }

    }

    private removeListeners(): void {
        this.player.removeEventListener('durationchange', this.onDurationChange);
        this.player.removeEventListener('sourcechange', this.onSourceChange);
        this.player.removeEventListener('timeupdate', this.onTimeUpdate); // TODO
        this.player.removeEventListener('play', this.onPlay); // TODO
        this.player.removeEventListener('ended', this.onEnded); // TODO
        this.player.removeEventListener('volumechange', this.onVolumeChange);
        this.player.removeEventListener('ratechange', this.onRateChange);
        this.player.removeEventListener('presentationmodechange', this.onPresentationModeChange);
        window.removeEventListener("resize", this.reportPlayerState);
        window.removeEventListener("blur", this.reportPlayerState);
        window.removeEventListener("focus", this.reportPlayerState);
        document.removeEventListener("scroll", this.reportPlayerState);
        document.removeEventListener("visibilitychange", this.reportPlayerState);
        if (this.player.ads) {
            this.player.ads.removeEventListener('adbreakend', this.onAdBreakEnd); //TODO
            this.player.ads.removeEventListener('adbegin', this.onAdBegin); //TODO
        }
        this.player.removeEventListener('playing', this.onFirstMainContentPlaying)
    }

    // EVENT HANDLERS
    private onDurationChange = (event: DurationChangeEvent) => {
        if (this.player.ads?.playing || this.mainContentLogPoints.length) return;
        const { duration } = event;
        const firstSecondOfMainContent = this.player.ads?.dai?.streamTimeForContentTime(1);
        const useDAITimeline = firstSecondOfMainContent && firstSecondOfMainContent !== 1;
        this.mainContentDuration = duration
        if (duration === Infinity) {
            this.mainContentLogPoints = [{reported: false, offset: this.player.currentTime + 1, name: "progress1"}]
        } else {
            this.mainContentLogPoints = [
                {reported: false, offset: duration * 0.75, name: "thirdQuartile"},
                {reported: false, offset: duration * 0.5, name: "midpoint"},
                {reported: false, offset: duration * 0.25, name: "firstQuartile"},
                {reported: false, offset: useDAITimeline ? firstSecondOfMainContent : 1, name: "progress1"}
            ]
        }
    }

    private onSourceChange = (event: SourceChangeEvent) => {
        Logger.logEvent(event);
        this.player.removeEventListener('playing', this.onFirstMainContentPlaying)
        this.player.addEventListener('playing', this.onFirstMainContentPlaying)
        this.mainContentLogPoints = []
        this.currentAdLogPoints = []
        this.currentAdMetadata = undefined
    }; 

    private onTimeUpdate = (event: TimeUpdateEvent) => {
        const { currentTime } = event;
        if (this.currentAdMetadata) {
            this.maybeReportLogPoint(currentTime, this.currentAdMetadata, this.currentAdLogPoints)
        } else {
            this.maybeReportLogPoint(currentTime, this.mainContentMetadata, this.mainContentLogPoints)
        }
    }

    private onFirstMainContentPlaying = () => {
        const isBeforePreroll = this.player.ads?.scheduledAdBreaks.find(adBreak => adBreak.timeOffset === 0);
        if (this.player.ads?.playing || isBeforePreroll) return;
        Logger.logAdScriptEvent("start",this.mainContentMetadata);
        this.JHMT.push(["start", this.mainContentMetadata]);
        this.player.removeEventListener("playing", this.onFirstMainContentPlaying);
    }

    private onPlay = (event: PlayEvent) => {
        Logger.logEvent(event);
        this.reportPlayerState;
    }

    private onEnded = (event: EndedEvent) => {
        Logger.logEvent(event);
        Logger.logAdScriptEvent("complete",this.mainContentMetadata);
        this.JHMT.push(["complete", this.mainContentMetadata]);
    }

    private onVolumeChange = (event: VolumeChangeEvent) => {
        Logger.logEvent(event);
        this.reportPlayerState();
    }

    private onRateChange = (event: RateChangeEvent) => {
        Logger.logEvent(event);
        this.reportPlayerState();
    }

    private onPresentationModeChange = (event: Event) => {
        Logger.logEvent(event);
        this.reportPlayerState();
    }

    private onAdBreakEnd = (event: AdBreakEvent<'adbreakend'>) => {
        Logger.logEvent(event);
        const { adBreak } = event;
        const { timeOffset, integration } = adBreak
        this.currentAdLogPoints = [];
        this.currentAdMetadata = undefined;
        if (integration === "google-dai" && timeOffset === 0) {
            this.onFirstMainContentPlaying()
        }
    }

    private onAdFirstQuartile = (event: AdEvent<'adfirstquartile'>) => {
        Logger.logEvent(event);
        Logger.logAdScriptEvent("firstquartile",this.currentAdMetadata);
        this.JHMT.push(["firstquartile", this.currentAdMetadata])
    }
    private onAdMidpoint = (event: AdEvent<'admidpoint'>) => {
        Logger.logEvent(event);
        Logger.logAdScriptEvent("midpoint",this.currentAdMetadata);
        this.JHMT.push(["midpoint", this.currentAdMetadata])
    }
    private onAdTirdQuartile = (event: AdEvent<'adthirdquartile'>) => {
        Logger.logEvent(event);
        Logger.logAdScriptEvent("thirdquartile",this.currentAdMetadata);
        this.JHMT.push(["thirdquartile", this.currentAdMetadata])
    }
    private onAdEnd = (event: AdEvent<'adend'>) => {
        Logger.logEvent(event);
        Logger.logAdScriptEvent("complete",this.currentAdMetadata);
        this.JHMT.push(["complete", this.currentAdMetadata])
    }

    private onAdBegin = (event: AdEvent<'adbegin'>) => {
        Logger.logEvent(event);
        if (event.ad.type !== "linear") return
        const adMetadataObject = this.buildAdMetadataObject(event)
        this.currentAdMetadata = adMetadataObject
        this.currentAdLogPoints = this.buildAdLogPoints(event.ad)
        Logger.logAdScriptEvent("start",this.currentAdMetadata);
        this.JHMT.push(["start",this.currentAdMetadata])
    }

    private buildAdLogPoints = (ad: Ad) => {
        const { duration } = ad
        if (ad.adBreak.integration === "theo" && duration) {
            return [
                {reported: false, offset: duration * 0.75, name: "thirdQuartile"},
                {reported: false, offset: duration * 0.5, name: "midpoint"},
                {reported: false, offset: duration * 0.25, name: "firstQuartile"},
                {reported: false, offset: 1, name: "progress1"}
            ]
        }
        return [{reported: false, offset: 1, name: "progress1"}]
    }

    private buildAdMetadataObject = (event: AdEvent<'adbegin'>): EmbeddedContentMetadata => {
        const { ad } = event;
        const { adBreak } = ad;
        if (this.adProcessor) {
            return {
                ...this.adProcessor(ad),
                type: this.getAdType(adBreak.timeOffset, this.player.duration, adBreak.integration),
                length: ad.duration?.toString() ?? ""
            }
        }
        return {
            assetid: ad.id ?? "",
            type: this.getAdType(adBreak.timeOffset, this.player.duration, adBreak.integration),
            length: ad.duration?.toString() ?? "",
            title: ad.integration?.includes("google") ? (ad as GoogleImaAd).title ?? "" : "",
            asmea: "",
            attributes: ""
        }
    }

    private getAdType = (offset: number, duration: number, integration: string | undefined): EmbeddedContentType => {
        if (offset === 0) return "preroll";
        if (offset === -1) return "postroll";
        if (duration - offset < 1 && integration === "google-dai") return "postroll"
        if (this.mainContentDuration && this.mainContentDuration - offset < 1 ) return "postroll"
        return "midroll" 
    }
    
    private reportPlayerState = () => {
        const playerState: PlayerState = {
            muted: this.player.muted ? 1 : 0,
            volume: this.player.volume * 100,
            triggeredByUser: this.player.autoplay ? 1 : 0,
            normalSpeed: this.player.playbackRate === 1 ? 1 : 0,
            fullscreen: this.player.presentation.currentMode === "fullscreen" ? 1 : 0,
            visibility: this.player.visibility.ratio * 100,
            width: this.player.element.clientWidth,
            height: this.player.element.clientHeight
        }
        Logger.logPlayerState(playerState)
        this.JHMTApi.setPlayerState(playerState)
    }

    private maybeReportLogPoint = (currentTime: number, metadata: MainVideoContentMetadata | EmbeddedContentMetadata, logPoints: LogPoint[]) => {
        logPoints.forEach(logPoint => {
            const { reported, offset, name } = logPoint
            if (!reported && currentTime >= offset && currentTime < offset + 1) {
                logPoint.reported = true
                Logger.logAdScriptEvent(name,metadata);
                this.JHMT.push([name,metadata])
            }
        })
    }
}
