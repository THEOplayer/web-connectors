import {
    ComscoreDeliveryAdvertisementCapability,
    ComscoreDeliveryComposition,
    ComscoreDeliveryMode,
    ComscoreDeliverySubscriptionType,
    ComscoreDistributionModel,
    ComscoreFeedType,
    ComscoreMediaFormat,
    ComscoreMediaType,
    type ComscoreMetadata
} from '../api/ComscoreMetadata';

export const buildContentMetadata = (metadata: ComscoreMetadata): ns_.analytics.StreamingAnalytics.ContentMetadata => {
    const contentMetadata = new ns_.analytics.StreamingAnalytics.ContentMetadata();
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
        customLabels
    } = metadata;
    contentMetadata.setMediaType(mapMediaType(mediaType));
    contentMetadata.setUniqueId(uniqueId);
    contentMetadata.setLength(length);
    if (c3) {
        contentMetadata.setDictionaryClassificationC3(c3);
    }
    if (c4) {
        contentMetadata.setDictionaryClassificationC4(c4);
    }
    if (c6) {
        contentMetadata.setDictionaryClassificationC6(c6);
    }
    contentMetadata.setStationTitle(stationTitle);
    if (stationCode) {
        contentMetadata.setStationCode(stationCode);
    }
    if (networkAffiliate) {
        contentMetadata.setNetworkAffiliate(networkAffiliate);
    }
    if (publisherName) {
        contentMetadata.setPublisherName(publisherName);
    }
    contentMetadata.setProgramTitle(programTitle);
    if (programId) {
        contentMetadata.setProgramId(programId);
    }
    contentMetadata.setEpisodeTitle(episodeTitle);
    if (episodeId) {
        contentMetadata.setEpisodeId(episodeId);
    }
    if (episodeSeasonNumber) {
        contentMetadata.setEpisodeSeasonNumber(episodeSeasonNumber);
    }
    if (episodeNumber) {
        contentMetadata.setEpisodeNumber(episodeNumber);
    }
    contentMetadata.setGenreName(genreName);
    if (genreId) {
        contentMetadata.setGenreId(genreId);
    }
    if (carryTvAdvertisementLoad) {
        contentMetadata.carryTvAdvertisementLoad(carryTvAdvertisementLoad);
    }
    if (classifyAsCompleteEpisode) {
        contentMetadata.classifyAsCompleteEpisode(classifyAsCompleteEpisode);
    }
    if (dateOfProduction) {
        const { year, month, day } = dateOfProduction;
        contentMetadata.setDateOfProduction(year, month, day);
    }
    if (timeOfProduction) {
        const { hours, minutes } = timeOfProduction;
        contentMetadata.setTimeOfProduction(hours, minutes);
    }
    if (dateOfTvAiring) {
        const { year, month, day } = dateOfTvAiring;
        contentMetadata.setDateOfTvAiring(year, month, day);
    }
    if (timeOfTvAiring) {
        const { hours, minutes } = timeOfTvAiring;
        contentMetadata.setTimeOfTvAiring(hours, minutes);
    }
    if (dateOfDigitalAiring) {
        const { year, month, day } = dateOfDigitalAiring;
        contentMetadata.setDateOfDigitalAiring(year, month, day);
    }
    if (timeOfDigitalAiring) {
        const { hours, minutes } = timeOfDigitalAiring;
        contentMetadata.setTimeOfDigitalAiring(hours, minutes);
    }
    if (feedType) {
        contentMetadata.setFeedType(mapFeedType(feedType));
    }
    contentMetadata.classifyAsAudioStream(classifyAsAudioStream);
    if (deliveryMode) {
        contentMetadata.setDeliveryMode(mapDeliveryMode(deliveryMode));
    }
    if (deliverySubscriptionType) {
        contentMetadata.setDeliverySubscriptionType(mapDeliverySubscriptionType(deliverySubscriptionType));
    }
    if (deliveryComposition) {
        contentMetadata.setDeliveryComposition(mapDeliveryComposition(deliveryComposition));
    }
    if (deliveryAdvertisementCapability) {
        contentMetadata.setDeliveryAdvertisementCapability(
            mapDeliveryAdvertisementCapability(deliveryAdvertisementCapability)
        );
    }
    if (mediaFormat) {
        contentMetadata.setMediaFormat(mapMediaFormat(mediaFormat));
    }
    if (distributionModel) {
        contentMetadata.setDistributionModel(mapDistributionModel(distributionModel));
    }
    if (playlistTitle) {
        contentMetadata.setPlaylistTitle(playlistTitle);
    }
    if (totalSegments) {
        contentMetadata.setTotalSegments(totalSegments);
    }
    if (clipUrl) {
        contentMetadata.setClipUrl(clipUrl);
    }
    if (videoDimension) {
        const { width, height } = videoDimension;
        contentMetadata.setVideoDimensions(width, height);
    }
    if (customLabels) {
        contentMetadata.addCustomLabels(customLabels);
    }
    return contentMetadata;
};

const mapMediaType = (mediaType: ComscoreMediaType): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType => {
    switch (mediaType) {
        case ComscoreMediaType.bumper:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.BUMPER;
        case ComscoreMediaType.live:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.LIVE;
        case ComscoreMediaType.longFormOnDemand:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.LONG_FORM_ON_DEMAND;
        case ComscoreMediaType.other:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.OTHER;
        case ComscoreMediaType.shortFormOnDemand:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.SHORT_FORM_ON_DEMAND;
        case ComscoreMediaType.userGeneratedLive:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.USER_GENERATED_LIVE;
        case ComscoreMediaType.userGeneratedLongFormOnDemand:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.USER_GENERATED_LONG_FORM_ON_DEMAND;
        case ComscoreMediaType.userGeneratedShortFormOnDemand:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.USER_GENERATED_SHORT_FORM_ON_DEMAND;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentType.OTHER;
    }
};

const mapFeedType = (feedType: ComscoreFeedType): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType => {
    switch (feedType) {
        case ComscoreFeedType.eastHD:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.EAST_HD;
        case ComscoreFeedType.westHD:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.WEST_HD;
        case ComscoreFeedType.eastSD:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.EAST_SD;
        case ComscoreFeedType.westSD:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.WEST_SD;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentFeedType.OTHER;
    }
};

const mapDeliveryMode = (
    deliveryMode: ComscoreDeliveryMode
): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode => {
    switch (deliveryMode) {
        case ComscoreDeliveryMode.linear:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode.LINEAR;
        case ComscoreDeliveryMode.ondemand:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode.ON_DEMAND;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryMode.ON_DEMAND;
    }
};

const mapDeliverySubscriptionType = (
    deliverySubscriptionType: ComscoreDeliverySubscriptionType
): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType => {
    switch (deliverySubscriptionType) {
        case ComscoreDeliverySubscriptionType.traditionalMvpd:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.TRADITIONAL_MVPD;
        case ComscoreDeliverySubscriptionType.virtualMvpd:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.VIRTUAL_MVPD;
        case ComscoreDeliverySubscriptionType.subscription:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.SUBSCRIPTION;
        case ComscoreDeliverySubscriptionType.transactional:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.TRANSACTIONAL;
        case ComscoreDeliverySubscriptionType.advertising:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.ADVERTISING;
        case ComscoreDeliverySubscriptionType.premium:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.PREMIUM;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliverySubscriptionType.SUBSCRIPTION;
    }
};

const mapDeliveryComposition = (
    deliveryComposition: ComscoreDeliveryComposition
): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition => {
    switch (deliveryComposition) {
        case ComscoreDeliveryComposition.clean:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition.CLEAN;
        case ComscoreDeliveryComposition.embed:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition.EMBED;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryComposition.EMBED;
    }
};

const mapDeliveryAdvertisementCapability = (
    deliveryAdvertisementCapability: ComscoreDeliveryAdvertisementCapability
): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability => {
    switch (deliveryAdvertisementCapability) {
        case ComscoreDeliveryAdvertisementCapability.none:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.NONE;
        case ComscoreDeliveryAdvertisementCapability.dynamicLoad:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.DYNAMIC_LOAD;
        case ComscoreDeliveryAdvertisementCapability.dynamicReplacement:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability
                .DYNAMIC_REPLACEMENT;
        case ComscoreDeliveryAdvertisementCapability.linear1day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_1DAY;
        case ComscoreDeliveryAdvertisementCapability.linear2day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_2DAY;
        case ComscoreDeliveryAdvertisementCapability.linear3day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_3DAY;
        case ComscoreDeliveryAdvertisementCapability.linear4day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_4DAY;
        case ComscoreDeliveryAdvertisementCapability.linear5day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_5DAY;
        case ComscoreDeliveryAdvertisementCapability.linear6day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_6DAY;
        case ComscoreDeliveryAdvertisementCapability.linear7day:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.LINEAR_7DAY;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDeliveryAdvertisementCapability.NONE;
    }
};

const mapMediaFormat = (
    mediaFormat: ComscoreMediaFormat
): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat => {
    switch (mediaFormat) {
        case ComscoreMediaFormat.fullContentEpisode:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_EPISODE;
        case ComscoreMediaFormat.fullContentMovie:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_MOVIE;
        case ComscoreMediaFormat.fullContentPodcast:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_GENERIC;
        case ComscoreMediaFormat.fullContentGeneric:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_GENERIC;
        case ComscoreMediaFormat.partialContentEpisode:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_EPISODE;
        case ComscoreMediaFormat.partialContentMovie:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_MOVIE;
        case ComscoreMediaFormat.partialContentPodcast:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_GENERIC;
        case ComscoreMediaFormat.partialContentGeneric:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PARTIAL_CONTENT_GENERIC;
        case ComscoreMediaFormat.previewEpisode:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PREVIEW_EPISODE;
        case ComscoreMediaFormat.previewMovie:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PREVIEW_MOVIE;
        case ComscoreMediaFormat.previewGeneric:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.PREVIEW_GENERIC;
        case ComscoreMediaFormat.extraEpisode:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.EXTRA_EPISODE;
        case ComscoreMediaFormat.extraMovie:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.EXTRA_MOVIE;
        case ComscoreMediaFormat.extraGeneric:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.EXTRA_GENERIC;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentMediaFormat.FULL_CONTENT_GENERIC;
    }
};

const mapDistributionModel = (
    distributionModel: ComscoreDistributionModel
): ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel => {
    switch (distributionModel) {
        case ComscoreDistributionModel.tvAndOnline:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel.TV_AND_ONLINE;
        case ComscoreDistributionModel.exclusivelyOnline:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel.EXCLUSIVELY_ONLINE;
        default:
            return ns_.analytics.StreamingAnalytics.ContentMetadata.ContentDistributionModel.EXCLUSIVELY_ONLINE;
    }
};
