import type { Ad, AdBreak, GoogleImaAd } from 'theoplayer';
import { AdMetadata, AdType, DCRAdMetadataCZ, NielsenCountry } from '../nielsen/Types';

export function getAdType(offset: number, duration: number): AdType {
    let currentAdBreakPosition: AdType = 'ad';
    if (offset === 0) {
        currentAdBreakPosition = 'preroll';
    } else if (offset < 0) {
        currentAdBreakPosition = 'postroll';
    } else if (duration - offset < 1) {
        currentAdBreakPosition = 'postroll'; // For DAI ads, the offset and duration will be converted from stream time to content time and coincide more or less
    } else if (offset > 0) {
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
    console.error('[NIELSEN - Error] No NielsenCountry was provided - sending only assetid and type');
    return adMetadata;
}
