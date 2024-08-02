import type { AdBreak } from 'theoplayer';
import { AdType } from '../nielsen/Types';

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
