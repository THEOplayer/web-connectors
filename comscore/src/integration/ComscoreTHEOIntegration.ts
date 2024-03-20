import { AdBreakEvent, AdEvent, ChromelessPlayer, EndedEvent, LoadedDataEvent, LoadedMetadataEvent, PauseEvent, PlayingEvent, RateChangeEvent, SeekingEvent, SourceChangeEvent, TimeUpdateEvent, WaitingEvent, version } from "theoplayer";
import { ComscoreConfiguration } from "../api/ComscoreConfiguration";
import { ComscoreDeliveryAdvertisementCapability, ComscoreDeliveryComposition, ComscoreDeliveryMode, ComscoreDeliverySubscriptionType, ComscoreDistributionModel, ComscoreFeedType, ComscoreMediaFormat, ComscoreMediaType, ComscoreMetadata } from "../api/ComscoreMetadata";
import { buildContentMetadata } from "./ComscoreContentMetadata";

const DEBUG_LOGS_ENABLED = true

enum ComscoreState {
    INITIALIZED,
    ADVERTISEMENT,
    ADVERTISEMENT_PAUSED,
    VIDEO,
    VIDEO_PAUSED,
    STOPPED
}

export class ComscoreTHEOIntegration {
    // References for constructor arguments
    private player: ChromelessPlayer;
    private configuration: ComscoreConfiguration;
    private metadata: ComscoreMetadata;

    // Playback state managed by the integration
    private state: ComscoreState = ComscoreState.INITIALIZED

    // Comscore library handles
    private analytics = ns_.analytics;
    private streamingAnalytics = new this.analytics.StreamingAnalytics();

    // Copy of main content's ContentMetadata
    private contentMetadata: ns_.analytics.StreamingAnalytics.ContentMetadata | null;

    // Advertisement related fields for use outside of ad event handlers
    private currentAdId: string | undefined = undefined
    private currentAdDuration: number | undefined = undefined
    private currentAdBreakOffset: number | undefined = undefined

    constructor(player: ChromelessPlayer, configuration: ComscoreConfiguration, metadata: ComscoreMetadata) {
        this.player = player
        this.configuration = configuration
        this.metadata = metadata

        this.analytics.setMediaPlayerName("THEOplayer")
        this.analytics.setMediaPlayerVersion(version)
    }

    public update(metadata: ComscoreMetadata) {
        this.metadata = metadata;
        this.contentMetadata = null
    }

    public destroy() {
        this.removeListeners();
    }

    private addListeners(): void {
        this.player.addEventListener("sourcechange", this.onSourceChange);
        this.player.addEventListener("ended", this.onEnded);
        this.player.addEventListener("loadeddata", this.onLoadedData);
        this.player.addEventListener("loadedmetadata", this.onLoadedMetadata);
        this.player.addEventListener("playing", this.onPlaying);
        this.player.addEventListener("seeking", this.onSeeking);
        this.player.addEventListener("pause", this.onPause);
        this.player.addEventListener("timeupdate", this.onTimeUpdate);
        this.player.addEventListener("ratechange", this.onRateChange);
        this.player.addEventListener("waiting", this.onWaiting);

        if (this.player.ads) {
            this.player.ads.addEventListener("adbegin", this.onAdBegin);
            this.player.ads.addEventListener("adbreakend", this.onAdBreakEnd);
        }
    }

    private removeListeners(): void {
        this.player.removeEventListener("sourcechange", this.onSourceChange);
        this.player.removeEventListener("ended", this.onEnded);
        this.player.removeEventListener("loadeddata", this.onLoadedData);
        this.player.removeEventListener("loadedmetadata", this.onLoadedMetadata);
        this.player.removeEventListener("playing", this.onPlaying);
        this.player.removeEventListener("seeking", this.onSeeking);
        this.player.removeEventListener("pause", this.onPause);
        this.player.removeEventListener("timeupdate", this.onTimeUpdate);
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
        adMetadata.setLength(adDuration)

        if (!this.contentMetadata) buildContentMetadata(this.metadata)
        adMetadata.setRelatedContentMetadata(this.contentMetadata)

        // adMetadata.addCustomLabels()

        if (DEBUG_LOGS_ENABLED) {
            console.log(`[COMSCORE] setMetadata (advertisement)`, adMetadata.getMetadataLabels())
        }
        this.streamingAnalytics.setMetadata(adMetadata)


    }

    private onSourceChange(event: SourceChangeEvent) {
        console.log(`[COMSCORE] ${event.type} event`);
        this.state = ComscoreState.INITIALIZED;
        // this.contentMetadata = null;
        if (DEBUG_LOGS_ENABLED) {
            console.log(`[COMSCORE] createPlaybackSession`);
        }
        this.streamingAnalytics.createPlaybackSession();
        

    }

    private onPlaying(event: PlayingEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onEnded(event: EndedEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onLoadedData(event: LoadedDataEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onLoadedMetadata(event: LoadedMetadataEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onSeeking(event: SeekingEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onPause(event: PauseEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onAdBegin(event: AdEvent<"adbegin">) {
        console.log(`[COMSCORE] ${event.type} event`)
        const { ad } = event
        this.currentAdBreakOffset = ad.adBreak.timeOffset
        this.currentAdId = ad.id
        this.currentAdDuration = ad.duration
    }

    private onAdBreakEnd(event: AdBreakEvent<"adbreakend">) {
        console.log(`[COMSCORE] ${event.type} event`)
        this.currentAdBreakOffset = undefined
        this.currentAdId = undefined
        this.currentAdDuration  = undefined
    }

    private onTimeUpdate(event: TimeUpdateEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onRateChange(event: RateChangeEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }

    private onWaiting(event: WaitingEvent) {
        console.log(`[COMSCORE] ${event.type} event`)
    }


}