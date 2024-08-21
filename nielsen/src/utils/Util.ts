import type { Ad, AdBreak, GoogleImaAd } from 'theoplayer';
import { AdMetadata, AdType, DCRAdMetadataCZ, NielsenCountry } from '../nielsen/Types';

export function getAdType(adBreak: AdBreak): AdType {
    const currentAdBreakTimeOffset = adBreak.timeOffset;
    let currentAdBreakPosition: AdType = 'ad';
    if (currentAdBreakTimeOffset === 0) {
        currentAdBreakPosition = 'preroll';
    } else if (currentAdBreakTimeOffset < 0) {
        currentAdBreakPosition = 'postroll';
    } else if (currentAdBreakTimeOffset > 0) {
        currentAdBreakPosition = 'midroll';
    }
    return currentAdBreakPosition;
}

export function buildDCRAdMetadata(ad: Ad, country: NielsenCountry): AdMetadata {
    const adMetadata = {
        assetid: ad.id ?? '',
        type: getAdType(ad.adBreak)
    };
    if (country == NielsenCountry.US) {
        return adMetadata;
    }
    if (country == NielsenCountry.CZ) {
        const dcrAdMetadataCZ: DCRAdMetadataCZ = {
            ...adMetadata,
            ['nol_c4']: 'PLACEHOLDER',
            ['nol_c5']: '2', // 1. regular show, 2. advertising, 3. trailer, 4. divide, 5. komerce (teleshopping,sponsor) TODO: provide API to control this
            ['nol_c6']: `p6,${adMetadata.type}`,
            title: (ad as GoogleImaAd).title ?? '',
            length: ad.duration?.toString() ?? '0'
        };
        return dcrAdMetadataCZ;
    }
    console.error('[NIELSEN - Error] Failed to extract Ad Metadata - sending placeholders instead');
    return {
        type: 'ad',
        assetid: '0000'
    };
}
