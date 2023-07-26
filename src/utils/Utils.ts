import {
    Constants,
    ConvivaAdBreakInfo,
    ConvivaDeviceMetadata,
    ConvivaMetadata,
    ConvivaOptions,
    ConvivaPlayerInfo
} from '@convivainc/conviva-js-coresdk';
import { AdVert } from '@theoplayer/yospace-connector-web';
import { Ad, AdBreak, ChromelessPlayer, GoogleImaAd, VerizonMediaAd, VerizonMediaAdBreak, version } from 'theoplayer';
import { ConvivaConfiguration } from '../integration/ConvivaHandler';

export function collectDeviceMetadata(): ConvivaDeviceMetadata {
    // Most device metadata is auto-collected by Conviva.
    return {
        [Constants.DeviceMetadata.CATEGORY]: Constants.DeviceCategory.WEB
    };
}

type AdBreakPosition = 'preroll' | 'midroll' | 'postroll';

export function calculateVerizonAdBreakInfo(adBreak: VerizonMediaAdBreak, adBreakIndex: number): ConvivaAdBreakInfo {
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

export function collectPlayerInfo(): ConvivaPlayerInfo {
    return {
        [Constants.FRAMEWORK_NAME]: 'THEOplayer',
        [Constants.FRAMEWORK_VERSION]: version
    };
}

export function collectContentMetadata(
    player: ChromelessPlayer,
    configuredContentMetadata: ConvivaMetadata
): ConvivaMetadata {
    const contentInfo: ConvivaMetadata = {};
    const duration = player.duration;
    if (!Number.isNaN(duration) && duration !== Infinity) {
        contentInfo[Constants.DURATION] = duration;
    }
    // @ts-ignore
    return {
        ...configuredContentMetadata,
        ...contentInfo
    };
}

export function collectYospaceAdMetadata(player: ChromelessPlayer, ad: AdVert): ConvivaMetadata {
    return {
        [Constants.ASSET_NAME]: ad.getProperty('AdTitle')?.getValue(),
        [Constants.STREAM_URL]: player.src!,
        [Constants.DURATION]: (ad.getDuration() / 1000) as any,
        'c3.ad.technology': Constants.AdType.SERVER_SIDE,
        'c3.ad.id': ad.getIdentifier(),
        'c3.ad.system': ad.getProperty('AdSystem')?.getValue(),
        'c3.ad.isSlate': ad.isFiller() ? 'true' : 'false',
        'c3.ad.mediaFileApiFramework': 'NA',
        'c3.ad.adStitcher': 'YoSpace',
        'c3.ad.firstAdSystem': 'NA',
        'c3.ad.firstAdId': 'NA',
        'c3.ad.firstCreativeId': 'NA',
        'c3.ad.creativeId': ad.getLinearCreative().getCreativeIdentifier()
    };
}

export function collectVerizonAdMetadata(ad: VerizonMediaAd): ConvivaMetadata {
    const adMetadata: ConvivaMetadata = {
        [Constants.DURATION]: ad.duration as any
    };
    const assetName = ad.creative;
    if (assetName) {
        adMetadata[Constants.ASSET_NAME] = assetName;
    }

    return adMetadata;
}

export function collectAdMetadata(ad: Ad): ConvivaMetadata {
    const adMetadata: ConvivaMetadata = {
        [Constants.DURATION]: ad.duration as any
    };
    const streamUrl = (ad as GoogleImaAd).mediaUrl! || ad.resourceURI;
    if (streamUrl) {
        adMetadata[Constants.STREAM_URL] = streamUrl;
    }
    const assetName = (ad as GoogleImaAd).title || ad.id;
    if (assetName) {
        adMetadata[Constants.ASSET_NAME] = assetName;
    }

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
