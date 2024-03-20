import { AdBreakEvent, AdEvent, ChromelessPlayer, EndedEvent, LoadedDataEvent, LoadedMetadataEvent, PauseEvent, PlayingEvent, RateChangeEvent, SeekingEvent, SourceChangeEvent, TimeUpdateEvent, WaitingEvent, version } from "theoplayer";
import { ComscoreConfiguration } from "../api/ComscoreConfiguration";
import { ComscoreDeliveryAdvertisementCapability, ComscoreDeliveryComposition, ComscoreDeliveryMode, ComscoreDeliverySubscriptionType, ComscoreDistributionModel, ComscoreFeedType, ComscoreMediaFormat, ComscoreMediaType, ComscoreMetadata } from "../api/ComscoreMetadata";

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
    private player: ChromelessPlayer;
    private configuration: ComscoreConfiguration;
    private metadata: ComscoreMetadata;

    private state: ComscoreState = ComscoreState.INITIALIZED

    private analytics = ns_.analytics;
    private streamingAnalytics = new this.analytics.StreamingAnalytics();

    // private contentMetadata: ns_.analytics.StreamingAnalytics.ContentMetadata;

    constructor(player: ChromelessPlayer, configuration: ComscoreConfiguration, metadata: ComscoreMetadata) {
        this.player = player
        this.configuration = configuration
        this.metadata = metadata

        this.streamingAnalytics.setMediaPlayerName("THEOplayer")
        this.streamingAnalytics.setMediaPlayerVersion(version)
    }

    public update(metadata: ComscoreMetadata) {
        this.metadata = metadata;
        // this.contentMetadata = null
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
        let contentMetadata = new this.analytics.StreamingAnalytics.ContentMetadata()
        const {
            mediaType,
            uniqueId,
            length,
            c3,
            c4,
            c6,
            stationTitle,
            stationCode,
            networkAffiliate,
            publisherName,
            programTitle,
            programId,
            episodeTitle,
            episodeId,
            episodeSeasonNumber,
            episodeNumber,
            genreName,
            genreId,
            carryTvAdvertisementLoad,
            classifyAsCompleteEpisode,
            dateOfProduction,
            timeOfProduction,
            dateOfTvAiring,
            timeOfTvAiring,
            dateOfDigitalAiring,
            timeOfDigitalAiring,
            feedType,
            classifyAsAudioStream,
            deliveryMode,
            deliverySubscriptionType,
            deliveryComposition,
            deliveryAdvertisementCapability,
            mediaFormat,
            distributionModel,
            playlistTitle,
            totalSegments,
            clipUrl,
            videoDimension,
            customLabels,
        } = this.metadata
        contentMetadata.setMediaType(this.mapMediaType(mediaType))
        contentMetadata.setUniqueId(uniqueId)
        contentMetadata.setLength(length)
        if(c3) {
            contentMetadata.setDictionaryClassificationC3(c3)    
        }
        if(c4) {
            contentMetadata.setDictionaryClassificationC4(c4)
        }
        if(c6) {
            contentMetadata.setDictionaryClassificationC6(c6)    
        }
        contentMetadata.setStationTitle(stationTitle)
        if(stationCode) {
            contentMetadata.setStationCode(stationCode)
        }
        if(networkAffiliate) {
            contentMetadata.setNetworkAffiliate(networkAffiliate)
        }
        if(publisherName) {
            contentMetadata.setPublisherName(publisherName)
        }
        contentMetadata.setProgramTitle(programTitle)
        if(programId) {
            contentMetadata.setProgramId(programId)
        }
        contentMetadata.setEpisodeTitle(episodeTitle)
        if(episodeId) {
            contentMetadata.setEpisodeId(episodeId)
        }
        if(episodeSeasonNumber) {
            contentMetadata.setEpisodeSeasonNumber(episodeSeasonNumber)
        }
        if(episodeNumber) {
            contentMetadata.setEpisodeNumber(episodeNumber)
        }
        genreName
        if(genreId) {
            contentMetadata.setGenreId(genreId)
        }
        if(carryTvAdvertisementLoad) {
            contentMetadata.carryTvAdvertisementLoad(carryTvAdvertisementLoad)
        }
        if(classifyAsCompleteEpisode) {
            contentMetadata.classifyAsCompleteEpisode(classifyAsCompleteEpisode)
        }
        if(dateOfProduction) {
            const { year, month, day } = dateOfProduction
            contentMetadata.setDateOfProduction(year,month,day)
        }
        if(timeOfProduction) {
            const { hours, minutes } = timeOfProduction
            contentMetadata.setTimeOfProduction(hours,minutes)
        }
        if(dateOfTvAiring) {
            const { year, month, day } = dateOfTvAiring
            contentMetadata.setDateOfTvAiring(year,month,day)
        }
        if(timeOfTvAiring) {
            const { hours, minutes } = timeOfTvAiring
            contentMetadata.setTimeOfTvAiring(hours,minutes)
        }
        if(dateOfDigitalAiring) {
            const { year, month, day } = dateOfDigitalAiring
            contentMetadata.setDateOfDigitalAiring(year,month,day)
        }
        if(timeOfDigitalAiring) {
            const { hours, minutes } = timeOfDigitalAiring
            contentMetadata.setTimeOfDigitalAiring(hours,minutes)
        }
        if(feedType) {
            contentMetadata.setFeedType(this.mapFeedType(feedType))
        }
        classifyAsAudioStream
        if(deliveryMode) {
            contentMetadata.setDeliveryMode(this.mapDeliveryMode(deliveryMode))
        }
        if(deliverySubscriptionType) {
            contentMetadata.setDeliverySubscriptionType(this.mapDeliverySubscriptionType(deliverySubscriptionType))
        }
        if(deliveryComposition) {
            contentMetadata.setDeliveryComposition(this.mapDeliveryComposition(deliveryComposition))
        }
        if(deliveryAdvertisementCapability) {
            contentMetadata.setDeliveryAdvertisementCapability(this.mapDeliveryAdvertisementCapability(deliveryAdvertisementCapability))
        }
        if(mediaFormat) {
            contentMetadata.setMediaFormat(this.mapMediaFormat(mediaFormat))
        }
        if(distributionModel) {
            contentMetadata.setDistributionModel(this.mapDistributionModel(distributionModel))
        }
        if(playlistTitle) {
            contentMetadata.setPlaylistTitle(playlistTitle)
        }
        if(totalSegments) {
            contentMetadata.setTotalSegments(totalSegments)
        }
        if(clipUrl) {
            contentMetadata.setClipUrl(clipUrl)
        }
        if(videoDimension) {
            const { width, height } = videoDimension
            contentMetadata.setVideoDimensions(width,height)
        }
        if(customLabels) {
            contentMetadata.addCustomLabels(customLabels)
        }
        this.streamingAnalytics.setMetadata(contentMetadata)

    }

    private setAdMetadata(adDuration, adBreakOffset, adId): void {
        let adMetadata = new this.analytics.StreamingAnalytics.AdvertisementMetadata()

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
    }

    private onAdBreakEnd(event: AdBreakEvent<"adbreakend">) {
        console.log(`[COMSCORE] ${event.type} event`)
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

    private mapMediaType(mediaType: ComscoreMediaType) {
        switch(mediaType){
            case ComscoreMediaType.bumper:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.BUMPER;
            case ComscoreMediaType.live:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.LIVE
            case ComscoreMediaType.longFormOnDemand:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.LONG_FORM_ON_DEMAND
            case ComscoreMediaType.other:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.OTHER
            case ComscoreMediaType.shortFormOnDemand:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.SHORT_FORM_ON_DEMAND
            case ComscoreMediaType.userGeneratedLive:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.USER_GENERATED_LIVE
            case ComscoreMediaType.userGeneratedLongFormOnDemand:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.USER_GENERATED_LONG_FORM_ON_DEMAND
            case ComscoreMediaType.userGeneratedShortFormOnDemand:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.USER_GENERATED_SHORT_FORM_ON_DEMAND
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentType.OTHER
        }
    }

    private mapFeedType(feedType: ComscoreFeedType) {
        switch(feedType){
            case ComscoreFeedType.eastHD:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.EAST_HD
            case ComscoreFeedType.westHD:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.WEST_HD
            case ComscoreFeedType.eastSD:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.EAST_SD
            case ComscoreFeedType.westSD:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.WEST_SD
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.OTHER
        }
    }

    private mapDeliveryMode(deliveryMode: ComscoreDeliveryMode) {
        switch(deliveryMode){
            case ComscoreDeliveryMode.linear:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode.LINEAR
            case ComscoreDeliveryMode.ondemand:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode.ON_DEMAND
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode.ON_DEMAND
        }
    }

    private mapDeliverySubscriptionType(deliverySubscriptionType: ComscoreDeliverySubscriptionType) {
        switch(deliverySubscriptionType){
            case ComscoreDeliverySubscriptionType.traditionalMvpd:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.TRADITIONAL_MVPD
            case ComscoreDeliverySubscriptionType.virtualMvpd:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.VIRTUAL_MVPD
            case ComscoreDeliverySubscriptionType.subscription:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.SUBSCRIPTION
            case ComscoreDeliverySubscriptionType.transactional:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.TRANSACTIONAL
            case ComscoreDeliverySubscriptionType.advertising:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.ADVERTISING
            case ComscoreDeliverySubscriptionType.premium:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.PREMIUM
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.SUBSCRIPTION
        }
    }

    private mapDeliveryComposition(deliveryComposition: ComscoreDeliveryComposition) {
        switch(deliveryComposition){
            case ComscoreDeliveryComposition.clean:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition.CLEAN
            case ComscoreDeliveryComposition.embed:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition.EMBED
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition.EMBED
        }
    }
    private mapDeliveryAdvertisementCapability(deliveryAdvertisementCapability: ComscoreDeliveryAdvertisementCapability) {
        switch(deliveryAdvertisementCapability){
            case ComscoreDeliveryAdvertisementCapability.none:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.NONE
            case ComscoreDeliveryAdvertisementCapability.dynamicLoad:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.DYNAMIC_LOAD
            case ComscoreDeliveryAdvertisementCapability.dynamicReplacement:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.DYNAMIC_REPLACEMENT
            case ComscoreDeliveryAdvertisementCapability.linear1day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_1DAY
            case ComscoreDeliveryAdvertisementCapability.linear2day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_2DAY
            case ComscoreDeliveryAdvertisementCapability.linear3day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_3DAY
            case ComscoreDeliveryAdvertisementCapability.linear4day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_4DAY
            case ComscoreDeliveryAdvertisementCapability.linear5day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_5DAY
            case ComscoreDeliveryAdvertisementCapability.linear6day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_6DAY
            case ComscoreDeliveryAdvertisementCapability.linear7day:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_7DAY
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.NONE
        }
    }
    private mapMediaFormat(mediaFormat: ComscoreMediaFormat) {
        switch(mediaFormat){
            case ComscoreMediaFormat.fullContentEpisode:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_EPISODE
            case ComscoreMediaFormat.fullContentMovie:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_MOVIE
            case ComscoreMediaFormat.fullContentPodcast:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_GENERIC
            case ComscoreMediaFormat.fullContentGeneric:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_GENERIC
            case ComscoreMediaFormat.partialContentEpisode:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_EPISODE
            case ComscoreMediaFormat.partialContentMovie:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_MOVIE
            case ComscoreMediaFormat.partialContentPodcast:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_GENERIC
            case ComscoreMediaFormat.partialContentGeneric:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_GENERIC
            case ComscoreMediaFormat.previewEpisode:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PREVIEW_EPISODE
            case ComscoreMediaFormat.previewMovie:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PREVIEW_MOVIE
            case ComscoreMediaFormat.previewGeneric:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PREVIEW_GENERIC
            case ComscoreMediaFormat.extraEpisode:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.EXTRA_EPISODE
            case ComscoreMediaFormat.extraMovie:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.EXTRA_MOVIE
            case ComscoreMediaFormat.extraGeneric:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.EXTRA_GENERIC
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_GENERIC
        }
    }
    private mapDistributionModel(distributionModel: ComscoreDistributionModel) {
        switch(distributionModel) {
            case ComscoreDistributionModel.tvAndOnline:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel.TV_AND_ONLINE
            case ComscoreDistributionModel.exclusivelyOnline:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel.EXCLUSIVELY_ONLINE
            default:
                return this.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel.EXCLUSIVELY_ONLINE
        }
    }


}