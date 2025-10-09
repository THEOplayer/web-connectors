import type { Ad, GoogleImaAd } from 'theoplayer';
import {
    type AdMetadata,
    type AdType,
    type DCRAdMetadataCZ,
    type DCRContentMetadata,
    type DCRContentMetadataCZ,
    type DCRContentMetadataUS,
    NielsenCountry,
    type NielsenDCRContentMetadata,
    type NielsenDCRContentMetadataCZ,
    type NielsenDCRContentMetadataUS
} from '../nielsen/Types';

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

export function buildDCRContentMetadata(
    metadata: NielsenDCRContentMetadata,
    country: NielsenCountry
): DCRContentMetadata | DCRContentMetadataUS | DCRContentMetadataCZ {
    const dcrContentMetadata = {
        type: 'content',
        assetid: metadata.assetid,
        program: metadata.program,
        title: metadata.title,
        length: metadata.length,
        airdate: metadata?.airdate ?? '19700101 00:00:01',
        isfullepisode: metadata.isfullepisode ? 'y' : 'n',
        adloadtype: metadata.adloadtype
    };
    if (country === NielsenCountry.CZ) {
        const { crossId1, segB, segC, c1, c2, c4, hasAds } = metadata as NielsenDCRContentMetadataCZ;
        const dcrContentMetadataCZ: DCRContentMetadataCZ = {
            ...dcrContentMetadata,
            ['crossId1']: crossId1,
            ['nol_c1']: `p1,${c1 ?? ''}`,
            ['nol_c2']: `p2,${c2 ?? ''}`,
            ['nol_c4']: `p4,${c4 ?? ''}`,
            segB: segB,
            segC: segC ?? '',
            hasAds: hasAds
        };
        return dcrContentMetadataCZ;
    }
    if (country === NielsenCountry.US) {
        const { crossId1, crossId2, segB, segC } = metadata as NielsenDCRContentMetadataUS;
        const dcrContentMetadataUS: DCRContentMetadataUS = {
            ...dcrContentMetadata
        };
        if (crossId1) dcrContentMetadataUS['crossId1'] = crossId1;
        if (crossId2) dcrContentMetadataUS['crossId2'] = crossId2;
        if (segB) dcrContentMetadataUS['segB'] = segB;
        if (segC) dcrContentMetadataUS['segC'] = segC;
        return dcrContentMetadataUS;
    }
    return dcrContentMetadata;
}

export function buildDCRAdMetadata(ad: Ad, country: NielsenCountry, duration: number): AdMetadata {
    const adMetadata = {
        assetid: ad.id ?? '',
        type: getAdType(ad.adBreak.timeOffset, duration)
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
