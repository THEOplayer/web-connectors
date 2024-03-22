import { AdBreakEvent, AdEvent, ChromelessPlayer, EndedEvent, LoadedMetadataEvent, PauseEvent, PlayEvent, PlayingEvent, RateChangeEvent, SeekedEvent, SeekingEvent, SourceChangeEvent, WaitingEvent, ErrorEvent, version } from "theoplayer";
import { ComscoreConfiguration } from "../api/ComscoreConfiguration";
import { ComscoreMetadata } from "../api/ComscoreMetadata";
import { buildContentMetadata } from "./ComscoreContentMetadata";

const DEBUG_LOGS_ENABLED = true

enum ComscoreState {
    INITIALIZED = "INITIALIZED",
    ADVERTISEMENT = "ADVERTISEMENT",
    ADVERTISEMENT_PAUSED = "ADVERTISEMENT_PAUSED",
    VIDEO = "VIDEO",
    VIDEO_PAUSED = "VIDEO_PAUSED",
    STOPPED = "STOPPED"
}

export class ComscoreStreamingAnalyticsTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private configuration: ComscoreConfiguration;
    private metadata: ComscoreMetadata;

    // Playback state managed by the integration
    private state: ComscoreState = ComscoreState.INITIALIZED
    private buffering: boolean = false
    private ended: boolean = false

    // Comscore library handles
    private analytics = ns_.analytics;
    private streamingAnalytics = new this.analytics.StreamingAnalytics();

    // Copy of main content's ContentMetadata
    private contentMetadata: ns_.analytics.StreamingAnalytics.ContentMetadata | null;

    // Advertisement related fields for use outside of ad event handlers
    private inAd: boolean = false
    private lastAdId: string | undefined = undefined
    private lastAdDuration: number | undefined = undefined
    private lastAdBreakOffset: number | undefined = undefined

    constructor(player: ChromelessPlayer, configuration: ComscoreConfiguration, metadata: ComscoreMetadata) {
        this.player = player
        this.configuration = configuration
        this.metadata = metadata

        this.streamingAnalytics.setMediaPlayerName("THEOplayer")
        this.streamingAnalytics.setMediaPlayerVersion(version)

        this.addListeners()
    }


    // PUBLIC methods
    public update(metadata: ComscoreMetadata) {
        this.metadata = metadata;
        this.contentMetadata = null
    }

    public destroy() {
        this.removeListeners();
    }

    private addListeners(): void {
        this.player.addEventListener("sourcechange", this.onSourceChange);
        this.player.addEventListener("play", this.onPlay);
        this.player.addEventListener("ended", this.onEnded);
        this.player.addEventListener("error", this.onError);
        this.player.addEventListener("loadedmetadata", this.onLoadedMetadata);
        this.player.addEventListener("playing", this.onPlaying);
        this.player.addEventListener("seeking", this.onSeeking);
        this.player.addEventListener("seeked", this.onSeeked);
        this.player.addEventListener("pause", this.onPause);
        this.player.addEventListener("ratechange", this.onRateChange);
        this.player.addEventListener("waiting", this.onWaiting);

        if (this.player.ads) {
            this.player.ads.addEventListener("adbegin", this.onAdBegin);
            this.player.ads.addEventListener("adbreakend", this.onAdBreakEnd);
        }
    }

    private removeListeners(): void {
        this.player.removeEventListener("sourcechange", this.onSourceChange);
        this.player.removeEventListener("play", this.onPlay);
        this.player.removeEventListener("ended", this.onEnded);
        this.player.removeEventListener("error", this.onError);
        this.player.removeEventListener("loadedmetadata", this.onLoadedMetadata);
        this.player.removeEventListener("playing", this.onPlaying);
        this.player.removeEventListener("seeking", this.onSeeking);
        this.player.removeEventListener("seeked", this.onSeeked);
        this.player.removeEventListener("pause", this.onPause);
        this.player.removeEventListener("ratechange", this.onRateChange);
        this.player.removeEventListener("waiting", this.onWaiting);

        if (this.player.ads) {
            this.player.ads.removeEventListener("adbegin", this.onAdBegin);
            this.player.ads.removeEventListener("adbreakend", this.onAdBreakEnd);
        }
    }

    private setContentMetadata(): void {
        let contentMetadata = buildContentMetadata(this.metadata)
        this.contentMetadata = contentMetadata
        if (DEBUG_LOGS_ENABLED) {
            console.log(`[COMSCORE] setMetadata (content)`, contentMetadata.getMetadataLabels())
        }
        this.streamingAnalytics.setMetadata(contentMetadata)

    }

    private setAdMetadata(adDuration: number, adBreakOffset: number, adId: string): void {
        let adMetadata = new this.analytics.StreamingAnalytics.AdvertisementMetadata()
        if (this.player.duration == Infinity) {
            adMetadata.setMediaType(this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.LIVE)
        } else if (adBreakOffset == 0) {
            adMetadata.setMediaType(this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.ON_DEMAND_PRE_ROLL)
        } else if (adBreakOffset == -1) {
            adMetadata.setMediaType(this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.ON_DEMAND_POST_ROLL)
        } else {
            adMetadata.setMediaType(this.analytics.StreamingAnalytics.AdvertisementMetadata.AdvertisementType.ON_DEMAND_MID_ROLL)
        }
        adMetadata.setUniqueId(adId)
        adMetadata.setLength(adDuration)

        if (!this.contentMetadata) buildContentMetadata(this.metadata)
        adMetadata.setRelatedContentMetadata(this.contentMetadata)
        if (DEBUG_LOGS_ENABLED) {
            console.log(`[COMSCORE] setMetadata (advertisement)`, adMetadata.getMetadataLabels())
        }
        this.streamingAnalytics.setMetadata(adMetadata)


    }

    // STATE TRANSITIONS
    private transitionToVideo(): void {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Trying to transition to VIDEO while in ${this.state}`);
        switch(this.state) {
            case ComscoreState.INITIALIZED:
                this.state = ComscoreState.VIDEO
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> VIDEO`);
                this.setContentMetadata()
                this.streamingAnalytics.notifyPlay()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPlay`);
                break;
            case ComscoreState.ADVERTISEMENT:
            case ComscoreState.ADVERTISEMENT_PAUSED:
            case ComscoreState.STOPPED:
                this.transitionToStopped();
                this.state = ComscoreState.VIDEO
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> VIDEO`);
                this.setContentMetadata()
                this.streamingAnalytics.notifyPlay()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPlay`);
                break;
            case ComscoreState.VIDEO_PAUSED:
                this.state = ComscoreState.VIDEO
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> VIDEO`);
                this.streamingAnalytics.notifyPlay()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPlay`);
                break;
            case ComscoreState.VIDEO:
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Ignoring transition from ${this.state} -> VIDEO`);
                break;
        }
    }

    private transitionToAdvertisement(): void {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Trying to transition to ADVERTISEMENT while in ${this.state}`);
        switch(this.state) {
            case ComscoreState.ADVERTISEMENT_PAUSED:
            case ComscoreState.INITIALIZED:
                this.state = ComscoreState.ADVERTISEMENT
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> ADVERTISEMENT`);
                this.streamingAnalytics.notifyPlay()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPlay`);
                break;
            case ComscoreState.VIDEO:
            case ComscoreState.VIDEO_PAUSED:
            case ComscoreState.STOPPED:
                this.transitionToStopped();
                this.state = ComscoreState.ADVERTISEMENT
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> ADVERTISEMENT`);
                this.streamingAnalytics.notifyPlay()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPlay`);
                break;
            case ComscoreState.ADVERTISEMENT:
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Ignoring transition from ${this.state} -> ADVERTISEMENT`);
                break;
        }

    }

    private transitionToPaused(): void {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Trying to transition to XXXXX_PAUSED while in ${this.state}`);
        switch(this.state) {
            case ComscoreState.VIDEO:
                this.state = ComscoreState.VIDEO_PAUSED
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> VIDEO_PAUSED`);
                this.streamingAnalytics.notifyPause()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPause`);
                break;
            case ComscoreState.ADVERTISEMENT:
                this.state = ComscoreState.ADVERTISEMENT_PAUSED
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> ADVERTISEMENT_PAUSED`);
                this.streamingAnalytics.notifyPause()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPause`);
                break;
            default:
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Ignoring transition from ${this.state} -> XXXXX_PAUSED`);
        }

    }

    private transitionToStopped(): void {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Trying to transition to STOPPED while in ${this.state}`);
        switch (this.state) {
            case ComscoreState.STOPPED:
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Ignoring transition from ${this.state} -> STOPPED`);
                break;
            default: 
                this.state = ComscoreState.STOPPED;
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] State change ${this.state} -> STOPPED`);
                this.streamingAnalytics.notifyEnd()
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyEnd`);
            }
    }

    // EVENT HANDLERS
    private onSourceChange(event: SourceChangeEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`);
        this.state = ComscoreState.INITIALIZED;
        this.contentMetadata = null;
        this.streamingAnalytics.createPlaybackSession();
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] createPlaybackSession`);

    }

    private onPlay(event: PlayEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        if (this.ended) {
            this.ended = false
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] play event after the stream ended`)
            this.streamingAnalytics.createPlaybackSession()
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] createPlaybackSession`);
        }
    }

    private onPlaying(event: PlayingEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        if (this.buffering) {
            this.buffering = false
            this.streamingAnalytics.notifyBufferStop()
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyBufferStop`)
            this.streamingAnalytics.notifyPlay()
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyPlay`)
        }

        if (this.inAd) {
            this.transitionToAdvertisement()
        } else if (this.lastAdBreakOffset && this.lastAdBreakOffset < 0) {
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] Ignore playing event after post-roll`)
        } else {
            this.transitionToVideo()
        }
    }

    private onEnded(event: EndedEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        this.transitionToStopped()
        this.ended = true
    }

    private onError(event: ErrorEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        this.transitionToStopped()
    }

    private onLoadedMetadata(event: LoadedMetadataEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        if (this.metadata.length == 0 && !this.inAd) {
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] LIVE stream detected`)
            try {
                const { seekable } = this.player
                if (seekable.length) {
                    const dvrWindowEnd = seekable.end(seekable.length - 1)
                    const dvrWindowStart = seekable.start(0)
                    const dvrWindowLengthInSeconds = dvrWindowEnd - dvrWindowStart
                    if (dvrWindowLengthInSeconds) {
                        this.streamingAnalytics.setDvrWindowLength(dvrWindowLengthInSeconds * 1000)
                        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] setDvrWindowLength`)
                    } else {
                        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] DVR window length was not > 0`)
                    }
                }
            } catch (error) {
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] There was a problem inspecting the seekable ranges on the loadedmetadata event`)
            }
        }
    }

    private onSeeking(event: SeekingEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        this.streamingAnalytics.notifySeekStart()
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifySeekStart`)
    }

    private onSeeked(event: SeekedEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        const { currentTime } = event

        if (this.player.duration == Infinity) {
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] seeked in a LIVE stream`)
            const { seekable } = this.player
            if (!seekable.length) {
                if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] no seekable ranges found when determining DVR window offset`)
                return
            }
            const dvrWindowEnd = seekable.end(seekable.length - 1)
            const dvrWindowOffsetInSeconds = dvrWindowEnd - currentTime
            this.streamingAnalytics.startFromDvrWindowOffset(dvrWindowOffsetInSeconds  * 1000)
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] startFromDvrWindowOffset`)
        } else {
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] seeked in a VOD stream`)
            this.streamingAnalytics.startFromPosition(currentTime  * 1000)
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] startFromPosition`)
        }
    }

    private onPause(event: PauseEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        this.transitionToPaused()
    }

    private onAdBegin(event: AdEvent<"adbegin">) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        const { ad } = event
        const { adIdProcessor } = this.configuration

        this.inAd = true
        this.lastAdBreakOffset = ad.adBreak.timeOffset
        this.lastAdId = adIdProcessor ? adIdProcessor(ad) : ad.id
        this.lastAdDuration = ad.duration
        if (!this.lastAdDuration && DEBUG_LOGS_ENABLED) {
            console.log("[COMSCORE] AD_BEGIN event with an ad duration of 0 found. Please check the ad configuration")
        }
        if (!this.lastAdId && DEBUG_LOGS_ENABLED) {
            console.log("[COMSCORE] AD_BEGIN event with an empty ad id found. Please check the ad configuration")
        }
        this.setAdMetadata(this.lastAdDuration ?? 0, this.lastAdBreakOffset, this.lastAdId ?? "")

         
    }

    private onAdBreakEnd(event: AdBreakEvent<"adbreakend">) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        this.inAd = false
    }

    private onRateChange(event: RateChangeEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        this.streamingAnalytics.notifyChangePlaybackRate(event.playbackRate)
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyChangePlaybackRate`)
    }

    private onWaiting(event: WaitingEvent) {
        if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] ${event.type} event`)
        if ((this.state == ComscoreState.ADVERTISEMENT && this.inAd) || (this.state == ComscoreState.VIDEO && !this.inAd)) {
            this.buffering = true
            this.streamingAnalytics.notifyBufferStart()
            if (DEBUG_LOGS_ENABLED) console.log(`[COMSCORE] notifyBufferStart`)
        }
    }


}