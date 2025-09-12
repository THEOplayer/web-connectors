import {
    Constants,
    type ConvivaAdBreakInfo,
    type ConvivaDeviceMetadata,
    type ConvivaKeys,
    type ConvivaMetadata,
    type ConvivaOptions,
    type ConvivaPlayerInfo
} from '@convivainc/conviva-js-coresdk';
import type { AdVert } from '@theoplayer/yospace-connector-web';
import {
    type Ad,
    type AdBreak,
    type ChromelessPlayer,
    type GoogleImaAd,
    TypedSource,
    type UplynkAd,
    type UplynkAdBreak,
    version
} from 'theoplayer';
import { ConvivaConfiguration } from '../integration/ConvivaHandler';

export function collectDefaultDeviceMetadata(): ConvivaDeviceMetadata {
    // Most device metadata is auto-collected by Conviva
    let category: ConvivaKeys = Constants.DeviceCategory.WEB;

    // look for more specific device category in the userAgent:
    const userAgent = navigator ? navigator.userAgent : '';
    if (/SMART-TV.*Tizen/i.test(userAgent)) {
        category = Constants.DeviceCategory.SAMSUNG_TV;
    } else if (/webos|web0s/i.test(userAgent)) {
        category = Constants.DeviceCategory.LG_TV;
    } else if (/VIZIO/i.test(userAgent)) {
        category = Constants.DeviceCategory.SMART_TV;
    } else if (/xbox/i.test(userAgent)) {
        category = Constants.DeviceCategory.XBOX;
    }

    return {
        [Constants.DeviceMetadata.CATEGORY]: category
    };
}

export function calculateAdType(adOrBreak: Ad | AdBreak) {
    switch (adOrBreak.integration) {
        case 'theoads': {
            return 'Server Guided';
        }
        case undefined:
        case '':
        case 'csai':
        case 'theo': // Deprecated
        case 'google-ima':
        case 'spotx':
        case 'freewheel': {
            return Constants.AdType.CLIENT_SIDE;
        }
        default: {
            // CustomAdIntegrationKinds are server side ad connectors.
            return Constants.AdType.SERVER_SIDE;
        }
    }
}

export function calculateUplynkAdBreakInfo(adBreak: UplynkAdBreak, adBreakIndex: number): ConvivaAdBreakInfo {
    return {
        [Constants.POD_DURATION]: adBreak.duration!,
        [Constants.POD_INDEX]: adBreakIndex
    };
}

export function calculateCurrentAdBreakPosition(adBreak: AdBreak): string {
    const currentAdBreakTimeOffset = adBreak.timeOffset;
    if (currentAdBreakTimeOffset === 0) {
        return Constants.AdPosition.PREROLL;
    }
    if (currentAdBreakTimeOffset < 0) {
        return Constants.AdPosition.POSTROLL;
    }
    return Constants.AdPosition.MIDROLL;
}

export function calculateCurrentAdBreakInfo(adBreak: AdBreak, adBreakIndex: number): ConvivaAdBreakInfo {
    return {
        [Constants.POD_POSITION]: calculateCurrentAdBreakPosition(adBreak),
        [Constants.POD_DURATION]: adBreak.maxDuration!,
        [Constants.POD_INDEX]: adBreakIndex
    };
}

export function calculateConvivaOptions(config: ConvivaConfiguration): ConvivaOptions {
    const options: ConvivaOptions = {};
    if (config.debug) {
        options[Constants.GATEWAY_URL] = config.gatewayUrl;
        options[Constants.LOG_LEVEL] = Constants.LogLevel.DEBUG;
    } else {
        // No need to set GATEWAY_URL and LOG_LEVEL settings for your production release.
        // The Conviva SDK provides the default values for production
    }
    return options;
}

export function calculateStreamType(player: ChromelessPlayer) {
    if (!Number.isNaN(player.duration)) {
        return isFinite(player.duration) ? Constants.StreamType.VOD : Constants.StreamType.LIVE;
    }
}

export function collectPlayerInfo(): ConvivaPlayerInfo {
    return {
        [Constants.FRAMEWORK_NAME]: 'THEOplayer',
        [Constants.FRAMEWORK_VERSION]: version
    };
}
export function collectPlaybackConfigMetadata(player: ChromelessPlayer) {
    const metadata: { [key: string]: string } = {};
    if (player.abr.targetBuffer) {
        metadata['targetBuffer'] = player.abr.targetBuffer.toString();
    }
    if (player.abr.bufferLookbackWindow) {
        metadata['bufferLookbackWindow'] = player.abr.bufferLookbackWindow.toString();
    }
    const abrStrategy = player.abr.strategy;
    if (abrStrategy) {
        metadata['abrStrategy'] = typeof abrStrategy === 'string' ? abrStrategy : abrStrategy.type.toString();
        if (typeof abrStrategy !== 'string' && abrStrategy.metadata?.bitrate) {
            metadata['abrMetadata'] = abrStrategy.metadata.bitrate.toString();
        }
    }
    const source = Array.isArray(player.source?.sources) ? player.source?.sources[0] : player.source?.sources;
    const liveOffset = (source as TypedSource)?.liveOffset?.toString();
    if (liveOffset) {
        metadata['liveOffset'] = liveOffset;
    }
    return metadata;
}

export function collectYospaceAdMetadata(player: ChromelessPlayer, ad: AdVert): ConvivaMetadata {
    return {
        // Cast to `any` because the index signature in ConvivaMetadata conflicts with its other properties...
        [Constants.ASSET_NAME]: (ad.getProperty('AdTitle')?.getValue() ?? null) as any,
        [Constants.STREAM_URL]: player.src!,
        [Constants.DURATION]: (ad.getDuration() / 1000) as any,
        'c3.ad.technology': Constants.AdType.SERVER_SIDE,
        'c3.ad.id': ad.getIdentifier(),
        'c3.ad.system': (ad.getProperty('AdSystem')?.getValue() ?? null) as any,
        'c3.ad.isSlate': ad.isFiller() ? 'true' : 'false',
        'c3.ad.mediaFileApiFramework': 'NA',
        'c3.ad.adStitcher': 'YoSpace',
        'c3.ad.firstAdSystem': 'NA',
        'c3.ad.firstAdId': 'NA',
        'c3.ad.firstCreativeId': 'NA',
        'c3.ad.creativeId': ad.getLinearCreative().getCreativeIdentifier()
    };
}

export function collectUplynkAdMetadata(ad: UplynkAd): ConvivaMetadata {
    const adMetadata: ConvivaMetadata = {
        [Constants.DURATION]: ad.duration as any
    };
    const assetName = ad.creative;
    if (assetName) {
        adMetadata[Constants.ASSET_NAME] = assetName;
    }

    return adMetadata;
}

export function updateAdMetadataForGoogleIma(ad: GoogleImaAd, metadata: ConvivaMetadata): ConvivaMetadata {
    const adMetadata = metadata;
    const streamUrl = ad.mediaUrl;
    if (streamUrl) {
        adMetadata[Constants.STREAM_URL] = streamUrl;
    }
    const assetName = ad.title;
    if (assetName) {
        adMetadata[Constants.ASSET_NAME] = assetName;
        adMetadata['c3.ad.creativeName'] = assetName;
    }
    if (ad.wrapperAdIds[0]) {
        adMetadata['c3.ad.firstAdId'] = ad.wrapperAdIds[0];
    }
    if (ad.wrapperCreativeIds[0]) {
        adMetadata['c3.ad.firstCreativeId'] = ad.wrapperCreativeIds[0];
    }
    if (ad.wrapperAdSystems[0]) {
        adMetadata['c3.ad.firstAdSystem'] = ad.wrapperAdSystems[0];
    }

    return adMetadata;
}

export function collectAdMetadata(ad: Ad): ConvivaMetadata {
    const adMetadata: ConvivaMetadata = {
        [Constants.DURATION]: ad.duration as any
    };
    const streamUrl = ad.resourceURI;
    if (streamUrl) {
        adMetadata[Constants.STREAM_URL] = streamUrl;
    }
    const assetName = ad.id;
    if (assetName) {
        adMetadata[Constants.ASSET_NAME] = assetName;
    }
    // [Required] This Ad ID is from the Ad Server that actually has the ad creative.
    // For wrapper ads, this is the last Ad ID at the end of the wrapper chain.
    adMetadata['c3.ad.id'] = ad.id || 'NA';

    // [Required] The creative name (may be the same as the ad name) as a string.
    // Creative name is available from the ad server. Set to "NA" if not available.
    adMetadata['c3.ad.creativeName'] = assetName || 'NA';

    // [Required] The creative id of the ad. This creative id is from the Ad Server that actually has the ad creative.
    // For wrapper ads, this is the last creative id at the end of the wrapper chain. Set to "NA" if not available.
    adMetadata['c3.ad.creativeId'] = ad.creativeId || 'NA';

    // [Required] The ad position as a string "Pre-roll", "Mid-roll" or "Post-roll"
    adMetadata['c3.ad.position'] = calculateCurrentAdBreakPosition(ad.adBreak);

    // [Preferred] A string that identifies the Ad System (i.e. the Ad Server). This Ad System represents
    // the Ad Server that actually has the ad creative. For wrapper ads, this is the last Ad System at the end of
    // the wrapper chain. Set to "NA" if not available
    adMetadata['c3.ad.system'] = ad.adSystem || 'NA';

    // [Preferred] A boolean value that indicates whether this ad is a Slate or not.
    // Set to "true" for Slate and "false" for a regular ad. By default, set to "false"
    adMetadata['c3.ad.isSlate'] = `${Boolean(ad.isSlate)}`;

    // [Preferred] Only valid for wrapper VAST responses.
    // This tag must capture the "first" Ad Id in the wrapper chain when a Linear creative is available or there is
    // an error at the end of the wrapper chain. Set to "NA" if not available. If there is no wrapper VAST response
    // then the Ad Id and First Ad Id should be the same.
    adMetadata['c3.ad.firstAdId'] = ad.id || 'NA';

    // [Preferred] Only valid for wrapper VAST responses.
    // This tag must capture the "first" Creative Id in the wrapper chain when a Linear creative is available or
    // there is an error at the end of the wrapper chain. Set to "NA" if not available. If there is no wrapper
    // VAST response then the Ad Creative Id and First Ad Creative Id should be the same.
    adMetadata['c3.ad.firstCreativeId'] = ad.creativeId || 'NA';

    // [Preferred] Only valid for wrapper VAST responses. This tag must capture the "first" Ad System in the wrapper
    // chain when a Linear creative is available or there is an error at the end of the wrapper chain. Set to "NA" if
    // not available. If there is no wrapper VAST response then the Ad System and First Ad System should be the same.
    // Examples: "GDFP", "NA".
    adMetadata['c3.ad.firstAdSystem'] = ad.adSystem || 'NA';

    // The name of the Ad Stitcher. If not using an Ad Stitcher, set to "NA"
    adMetadata['c3.ad.adStitcher'] = 'NA';

    // Report ad content type
    adMetadata[Constants.IS_LIVE] = Constants.StreamType.VOD;

    return adMetadata;
}

export function calculateBufferLength(player: ChromelessPlayer): number {
    const buffered = player.buffered;
    if (buffered === undefined) {
        return 0;
    }
    let bufferLength = 0;
    for (let i = 0; i < buffered.length; i += 1) {
        const start = buffered.start(i);
        const end = buffered.end(i);
        if (start <= player.currentTime && player.currentTime < end) {
            bufferLength += end - player.currentTime;
        }
    }
    return bufferLength * 1000;
}

export function bufferedToString(buffered: TimeRanges) {
    const ranges: string[] = [];
    for (let i = 0; i < buffered.length; i++) {
        ranges.push(`${buffered.start(i)}-${buffered.end(i)}`);
    }
    return `[${ranges.join(',')}]`;
}
